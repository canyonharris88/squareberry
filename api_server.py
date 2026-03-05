#!/usr/bin/env python3
"""SquareBerry Pipeline API v2 — Full backend with Alerts, Reports, Settings, and Pipeline improvements."""
import sqlite3
import json
import csv
import io
import os
import time
import threading
from collections import defaultdict
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, Response, Request
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse, HTMLResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Optional, List

DB_PATH = os.path.join(os.path.dirname(__file__), "pipeline.db")

# Thread-local storage for per-request DB connections
_local = threading.local()

def get_db():
    """Get a thread-local database connection for safety."""
    if not hasattr(_local, 'db') or _local.db is None:
        _local.db = sqlite3.connect(DB_PATH, check_same_thread=False)
        _local.db.row_factory = sqlite3.Row
        _local.db.execute("PRAGMA journal_mode=WAL")
        _local.db.execute("PRAGMA foreign_keys=ON")
    return _local.db

def init_db(db):
    db.executescript("""
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            address TEXT NOT NULL,
            city TEXT,
            county TEXT,
            state TEXT DEFAULT 'MI',
            acreage REAL,
            asking_price REAL,
            price_per_acre REAL,
            zoning TEXT,
            lot_yield INTEGER,
            feasibility_rating TEXT,
            gross_profit_pct REAL,
            max_land_price REAL,
            listing_url TEXT,
            pdf_url TEXT,
            source TEXT DEFAULT 'daily_email',
            notes TEXT,
            stage TEXT DEFAULT 'new_lead',
            starred INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            email_date TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
        CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
        CREATE INDEX IF NOT EXISTS idx_leads_address ON leads(address);

        -- ── Alerts ──
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            county TEXT,
            min_acreage REAL,
            max_acreage REAL,
            max_price REAL,
            zoning_filter TEXT,
            criteria_display TEXT NOT NULL,
            active INTEGER DEFAULT 1,
            last_checked TEXT,
            new_matches INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        -- ── Reports ──
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            lead_id INTEGER,
            pdf_url TEXT,
            listing_url TEXT,
            address TEXT,
            acreage REAL,
            county TEXT,
            feasibility_rating TEXT,
            file_size TEXT,
            report_date TEXT DEFAULT (date('now')),
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_reports_lead ON reports(lead_id);

        -- ── Settings (single-row key-value store) ──
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT DEFAULT (datetime('now'))
        );
    """)
    db.commit()

# Initialize DB schema on startup
_init_db = get_db()
init_db(_init_db)

@asynccontextmanager
async def lifespan(app):
    yield
    # Cleanup thread-local connections
    if hasattr(_local, 'db') and _local.db:
        _local.db.close()

app = FastAPI(title="SquareBerry Pipeline API v2", lifespan=lifespan)

# CORS — allow deployed sites and localhost for development
ALLOWED_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
]
# Allow any Perplexity-hosted domain (deploy_website URLs)
# Also allow the __PORT_8000__ placeholder pattern used by deploy
import re
_PERPLEXITY_ORIGIN_RE = re.compile(r'^https://.*\.perplexity\.ai$')

class DynamicCORSMiddleware:
    """CORS middleware that allows Perplexity deploy URLs dynamically."""
    def __init__(self, app):
        self._app = app
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            headers = dict(scope.get("headers", []))
            origin = None
            for k, v in scope.get("headers", []):
                if k == b"origin":
                    origin = v.decode("utf-8")
                    break
            if origin and (origin in ALLOWED_ORIGINS or _PERPLEXITY_ORIGIN_RE.match(origin)):
                async def send_wrapper(message):
                    if message["type"] == "http.response.start":
                        response_headers = list(message.get("headers", []))
                        response_headers.append((b"access-control-allow-origin", origin.encode()))
                        response_headers.append((b"access-control-allow-methods", b"GET,POST,PUT,PATCH,DELETE,OPTIONS"))
                        response_headers.append((b"access-control-allow-headers", b"content-type"))
                        message["headers"] = response_headers
                    await send(message)
                await self._app(scope, receive, send_wrapper)
                return
        await self._app(scope, receive, send)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
# Note: keeping wildcard CORS for now since deployed URLs are dynamic.
# The DynamicCORSMiddleware above is ready when we want to lock it down.

# ── Simple in-memory rate limiter ──
_rate_limit_store = defaultdict(list)
_RATE_LIMIT_WINDOW = 60  # seconds
_RATE_LIMIT_MAX = 120    # requests per window (generous for personal use)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Basic rate limiting per IP address."""
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    
    # Clean old entries
    _rate_limit_store[client_ip] = [
        t for t in _rate_limit_store[client_ip] if now - t < _RATE_LIMIT_WINDOW
    ]
    
    if len(_rate_limit_store[client_ip]) >= _RATE_LIMIT_MAX:
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded", "retry_after": _RATE_LIMIT_WINDOW}
        )
    
    _rate_limit_store[client_ip].append(now)
    response = await call_next(request)
    return response


# ── Config endpoint (serves non-secret client config) ──
@app.get("/api/config")
async def get_config():
    """Serve client-side configuration like the Mapbox token."""
    return {
        "mapbox_token": os.environ.get("MAPBOX_TOKEN", "")
    }


# ══════════════════════════════════════════════════════════════════════════════
# ── Lead Models ──
# ══════════════════════════════════════════════════════════════════════════════

class LeadCreate(BaseModel):
    address: str = Field(..., max_length=500)
    city: Optional[str] = Field(None, max_length=200)
    county: Optional[str] = Field(None, max_length=200)
    state: str = Field("MI", max_length=2)
    acreage: Optional[float] = Field(None, ge=0, le=100000)
    asking_price: Optional[float] = Field(None, ge=0, le=1e9)
    price_per_acre: Optional[float] = Field(None, ge=0, le=1e9)
    zoning: Optional[str] = Field(None, max_length=50)
    lot_yield: Optional[int] = Field(None, ge=0, le=10000)
    feasibility_rating: Optional[str] = Field(None, max_length=50)
    gross_profit_pct: Optional[float] = Field(None, ge=-100, le=1000)
    max_land_price: Optional[float] = Field(None, ge=0, le=1e9)
    listing_url: Optional[str] = Field(None, max_length=2000)
    pdf_url: Optional[str] = Field(None, max_length=2000)
    source: str = Field("daily_email", max_length=100)
    notes: Optional[str] = Field(None, max_length=5000)
    stage: str = Field("new_lead", max_length=50)
    email_date: Optional[str] = Field(None, max_length=50)

class LeadUpdate(BaseModel):
    stage: Optional[str] = Field(None, max_length=50)
    starred: Optional[int] = Field(None, ge=0, le=1)
    notes: Optional[str] = Field(None, max_length=5000)
    feasibility_rating: Optional[str] = Field(None, max_length=50)
    gross_profit_pct: Optional[float] = Field(None, ge=-100, le=1000)
    max_land_price: Optional[float] = Field(None, ge=0, le=1e9)

class BulkLeadCreate(BaseModel):
    leads: List[LeadCreate]

class BulkStageUpdate(BaseModel):
    lead_ids: List[int]
    stage: str = Field(..., max_length=50)


# ══════════════════════════════════════════════════════════════════════════════
# ── Lead Endpoints ──
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/api/leads")
async def get_leads(
    stage: Optional[str] = None,
    county: Optional[str] = None,
    starred: Optional[int] = None,
    search: Optional[str] = None,
    sort: str = "created_at",
    order: str = "desc",
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    db = get_db()
    query = "SELECT * FROM leads WHERE 1=1"
    params = []
    
    if stage:
        query += " AND stage = ?"
        params.append(stage)
    if county:
        query += " AND county = ?"
        params.append(county)
    if starred is not None:
        query += " AND starred = ?"
        params.append(starred)
    if search:
        query += " AND (address LIKE ? OR city LIKE ? OR county LIKE ? OR notes LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s, s])
    
    # Whitelist sort columns
    allowed_sort = {"created_at", "updated_at", "asking_price", "acreage", "price_per_acre", "gross_profit_pct"}
    if sort not in allowed_sort:
        sort = "created_at"
    order = "ASC" if order.upper() == "ASC" else "DESC"
    query += f" ORDER BY {sort} {order} LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    rows = db.execute(query, params).fetchall()
    return [dict(r) for r in rows]

@app.post("/api/leads", status_code=201)
async def create_lead(lead: LeadCreate):
    db = get_db()
    cur = db.execute("""
        INSERT INTO leads (address, city, county, state, acreage, asking_price, price_per_acre,
            zoning, lot_yield, feasibility_rating, gross_profit_pct, max_land_price,
            listing_url, pdf_url, source, notes, stage, email_date)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
        lead.address, lead.city, lead.county, lead.state,
        lead.acreage, lead.asking_price, lead.price_per_acre,
        lead.zoning, lead.lot_yield, lead.feasibility_rating,
        lead.gross_profit_pct, lead.max_land_price,
        lead.listing_url, lead.pdf_url, lead.source,
        lead.notes, lead.stage, lead.email_date
    ))
    db.commit()
    row = db.execute("SELECT * FROM leads WHERE id = ?", (cur.lastrowid,)).fetchone()
    return dict(row)

@app.post("/api/leads/bulk", status_code=201)
async def create_leads_bulk(body: BulkLeadCreate):
    db = get_db()
    created = []
    for lead in body.leads:
        cur = db.execute("""
            INSERT INTO leads (address, city, county, state, acreage, asking_price, price_per_acre,
                zoning, lot_yield, feasibility_rating, gross_profit_pct, max_land_price,
                listing_url, pdf_url, source, notes, stage, email_date)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            lead.address, lead.city, lead.county, lead.state,
            lead.acreage, lead.asking_price, lead.price_per_acre,
            lead.zoning, lead.lot_yield, lead.feasibility_rating,
            lead.gross_profit_pct, lead.max_land_price,
            lead.listing_url, lead.pdf_url, lead.source,
            lead.notes, lead.stage, lead.email_date
        ))
        created.append(cur.lastrowid)
    db.commit()
    rows = db.execute(f"SELECT * FROM leads WHERE id IN ({','.join('?'*len(created))})", created).fetchall()
    return [dict(r) for r in rows]

@app.get("/api/leads/{lead_id}")
async def get_lead(lead_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Lead not found")
    return dict(row)

@app.patch("/api/leads/{lead_id}")
async def update_lead(lead_id: int, update: LeadUpdate):
    db = get_db()
    fields = {k: v for k, v in update.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(400, "No fields to update")
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    set_clause += ", updated_at = datetime('now')"
    db.execute(f"UPDATE leads SET {set_clause} WHERE id = ?", [*fields.values(), lead_id])
    db.commit()
    row = db.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Lead not found")
    return dict(row)

@app.delete("/api/leads/{lead_id}", status_code=204)
async def delete_lead(lead_id: int):
    db = get_db()
    db.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
    db.commit()

@app.patch("/api/leads/bulk/stage")
async def bulk_update_stage(body: BulkStageUpdate):
    if not body.lead_ids:
        raise HTTPException(400, "No lead IDs provided")
    db = get_db()
    placeholders = ','.join('?' * len(body.lead_ids))
    db.execute(
        f"UPDATE leads SET stage = ?, updated_at = datetime('now') WHERE id IN ({placeholders})",
        [body.stage, *body.lead_ids]
    )
    db.commit()
    rows = db.execute(f"SELECT * FROM leads WHERE id IN ({placeholders})", body.lead_ids).fetchall()
    return [dict(r) for r in rows]

@app.get("/api/leads/export/csv")
async def export_leads_csv(
    stage: Optional[str] = None,
    county: Optional[str] = None
):
    db = get_db()
    query = "SELECT * FROM leads WHERE 1=1"
    params = []
    if stage:
        query += " AND stage = ?"
        params.append(stage)
    if county:
        query += " AND county = ?"
        params.append(county)
    query += " ORDER BY created_at DESC"
    rows = db.execute(query, params).fetchall()
    
    output = io.StringIO()
    if rows:
        writer = csv.DictWriter(output, fieldnames=dict(rows[0]).keys())
        writer.writeheader()
        for row in rows:
            writer.writerow(dict(row))
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=squareberry_leads.csv"}
    )

@app.get("/api/stats")
async def get_stats():
    db = get_db()
    total = db.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
    by_stage = db.execute("SELECT stage, COUNT(*) as count FROM leads GROUP BY stage").fetchall()
    starred_count = db.execute("SELECT COUNT(*) FROM leads WHERE starred = 1").fetchone()[0]
    avg_price_per_acre = db.execute("SELECT AVG(price_per_acre) FROM leads WHERE price_per_acre IS NOT NULL").fetchone()[0]
    
    return {
        "total_leads": total,
        "starred": starred_count,
        "by_stage": {r["stage"]: r["count"] for r in by_stage},
        "avg_price_per_acre": round(avg_price_per_acre, 2) if avg_price_per_acre else None
    }


# ══════════════════════════════════════════════════════════════════════════════
# ── Alerts Endpoints ──
# ══════════════════════════════════════════════════════════════════════════════

class AlertCreate(BaseModel):
    county: Optional[str] = Field(None, max_length=200)
    min_acreage: Optional[float] = Field(None, ge=0)
    max_acreage: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = Field(None, ge=0)
    zoning_filter: Optional[str] = Field(None, max_length=100)
    criteria_display: str = Field(..., max_length=500)

@app.get("/api/alerts")
async def get_alerts():
    db = get_db()
    rows = db.execute("SELECT * FROM alerts ORDER BY created_at DESC").fetchall()
    return [dict(r) for r in rows]

@app.post("/api/alerts", status_code=201)
async def create_alert(alert: AlertCreate):
    db = get_db()
    cur = db.execute("""
        INSERT INTO alerts (county, min_acreage, max_acreage, max_price, zoning_filter, criteria_display)
        VALUES (?,?,?,?,?,?)
    """, (alert.county, alert.min_acreage, alert.max_acreage, alert.max_price, alert.zoning_filter, alert.criteria_display))
    db.commit()
    row = db.execute("SELECT * FROM alerts WHERE id = ?", (cur.lastrowid,)).fetchone()
    return dict(row)

@app.delete("/api/alerts/{alert_id}", status_code=204)
async def delete_alert(alert_id: int):
    db = get_db()
    db.execute("DELETE FROM alerts WHERE id = ?", (alert_id,))
    db.commit()

@app.patch("/api/alerts/{alert_id}/toggle")
async def toggle_alert(alert_id: int):
    db = get_db()
    db.execute("UPDATE alerts SET active = NOT active WHERE id = ?", (alert_id,))
    db.commit()
    row = db.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Alert not found")
    return dict(row)


# ══════════════════════════════════════════════════════════════════════════════
# ── Reports Endpoints ──
# ══════════════════════════════════════════════════════════════════════════════

class ReportCreate(BaseModel):
    title: str = Field(..., max_length=500)
    lead_id: Optional[int] = None
    pdf_url: Optional[str] = Field(None, max_length=2000)
    listing_url: Optional[str] = Field(None, max_length=2000)
    address: Optional[str] = Field(None, max_length=500)
    acreage: Optional[float] = None
    county: Optional[str] = Field(None, max_length=200)
    feasibility_rating: Optional[str] = Field(None, max_length=50)
    file_size: Optional[str] = Field(None, max_length=50)
    report_date: Optional[str] = Field(None, max_length=50)

@app.get("/api/reports")
async def get_reports():
    db = get_db()
    rows = db.execute("SELECT * FROM reports ORDER BY created_at DESC").fetchall()
    return [dict(r) for r in rows]

@app.post("/api/reports", status_code=201)
async def create_report(report: ReportCreate):
    db = get_db()
    cur = db.execute("""
        INSERT INTO reports (title, lead_id, pdf_url, listing_url, address, acreage, county, feasibility_rating, file_size, report_date)
        VALUES (?,?,?,?,?,?,?,?,?,?)
    """, (
        report.title, report.lead_id, report.pdf_url, report.listing_url,
        report.address, report.acreage, report.county,
        report.feasibility_rating, report.file_size, report.report_date
    ))
    db.commit()
    row = db.execute("SELECT * FROM reports WHERE id = ?", (cur.lastrowid,)).fetchone()
    return dict(row)

@app.delete("/api/reports/{report_id}", status_code=204)
async def delete_report(report_id: int):
    db = get_db()
    db.execute("DELETE FROM reports WHERE id = ?", (report_id,))
    db.commit()


# ══════════════════════════════════════════════════════════════════════════════
# ── Settings Endpoints ──
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/settings")
async def get_settings():
    db = get_db()
    rows = db.execute("SELECT key, value FROM settings").fetchall()
    return {r["key"]: r["value"] for r in rows}

@app.put("/api/settings")
async def update_settings(settings: dict):
    db = get_db()
    for key, value in settings.items():
        db.execute(
            "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",
            (str(key)[:100], str(value)[:2000])
        )
    db.commit()
    rows = db.execute("SELECT key, value FROM settings").fetchall()
    return {r["key"]: r["value"] for r in rows}


# ── Static files (must be LAST — catch-all) ──
app.mount("/", StaticFiles(directory=SCRIPT_DIR, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)
