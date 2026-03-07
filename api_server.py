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
    "https://squareberry.app",
    "https://www.squareberry.app",
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
# ── Alert Models ──
# ══════════════════════════════════════════════════════════════════════════════

class AlertCreate(BaseModel):
    county: Optional[str] = Field(None, max_length=200)
    min_acreage: Optional[float] = Field(None, ge=0, le=100000)
    max_acreage: Optional[float] = Field(None, ge=0, le=100000)
    max_price: Optional[float] = Field(None, ge=0, le=1e9)
    zoning_filter: Optional[str] = Field(None, max_length=100)
    criteria_display: str = Field(..., max_length=500)

class AlertUpdate(BaseModel):
    active: Optional[int] = Field(None, ge=0, le=1)
    county: Optional[str] = Field(None, max_length=200)
    min_acreage: Optional[float] = Field(None, ge=0, le=100000)
    max_acreage: Optional[float] = Field(None, ge=0, le=100000)
    max_price: Optional[float] = Field(None, ge=0, le=1e9)
    zoning_filter: Optional[str] = Field(None, max_length=100)
    criteria_display: Optional[str] = Field(None, max_length=500)


# ══════════════════════════════════════════════════════════════════════════════
# ── Report Models ──
# ══════════════════════════════════════════════════════════════════════════════

class ReportCreate(BaseModel):
    title: str = Field(..., max_length=500)
    lead_id: Optional[int] = None
    pdf_url: Optional[str] = Field(None, max_length=2000)
    listing_url: Optional[str] = Field(None, max_length=2000)
    address: Optional[str] = Field(None, max_length=500)
    acreage: Optional[float] = Field(None, ge=0, le=100000)
    county: Optional[str] = Field(None, max_length=200)
    feasibility_rating: Optional[str] = Field(None, max_length=50)
    file_size: Optional[str] = Field(None, max_length=20)
    report_date: Optional[str] = Field(None, max_length=50)


# ══════════════════════════════════════════════════════════════════════════════
# ── Settings Models ──
# ══════════════════════════════════════════════════════════════════════════════

class SettingsPayload(BaseModel):
    settings: dict


# ══════════════════════════════════════════════════════════════════════════════
# ── Lead Routes (v2 — enhanced) ──
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/leads")
def list_leads(
    stage: Optional[str] = None,
    county: Optional[str] = None,
    starred: Optional[int] = None,
    search: Optional[str] = None,
    sort: Optional[str] = Query(None, description="Sort field: created_at, acreage, asking_price, address, feasibility_rating"),
    order: Optional[str] = Query("desc", description="asc or desc"),
    min_acreage: Optional[float] = None,
    max_acreage: Optional[float] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = 500
):
    """List leads with filtering, search, and sorting."""
    conditions = []
    params = []

    if stage:
        conditions.append("stage = ?")
        params.append(stage)
    if county:
        conditions.append("county = ?")
        params.append(county)
    if starred is not None:
        conditions.append("starred = ?")
        params.append(starred)
    if search:
        conditions.append("(address LIKE ? OR city LIKE ? OR county LIKE ? OR zoning LIKE ? OR notes LIKE ?)")
        s = f"%{search}%"
        params.extend([s, s, s, s, s])
    if min_acreage is not None:
        conditions.append("acreage >= ?")
        params.append(min_acreage)
    if max_acreage is not None:
        conditions.append("acreage <= ?")
        params.append(max_acreage)
    if min_price is not None:
        conditions.append("asking_price >= ?")
        params.append(min_price)
    if max_price is not None:
        conditions.append("asking_price <= ?")
        params.append(max_price)

    where = " WHERE " + " AND ".join(conditions) if conditions else ""

    # Validate sort field to prevent SQL injection
    allowed_sorts = {"created_at", "acreage", "asking_price", "address", "feasibility_rating", "price_per_acre", "updated_at", "starred"}
    sort_field = sort if sort in allowed_sorts else "created_at"
    sort_order = "ASC" if order and order.lower() == "asc" else "DESC"

    query = f"SELECT * FROM leads{where} ORDER BY {sort_field} {sort_order} LIMIT ?"
    params.append(limit)

    rows = get_db().execute(query, params).fetchall()
    return [dict(r) for r in rows]


@app.get("/api/leads/stages")
def lead_stages():
    """Get count of leads per stage."""
    rows = get_db().execute(
        "SELECT stage, COUNT(*) as count FROM leads GROUP BY stage ORDER BY count DESC"
    ).fetchall()
    return [dict(r) for r in rows]


@app.get("/api/leads/counties")
def lead_counties():
    """Get distinct counties for filter dropdowns."""
    rows = get_db().execute(
        "SELECT DISTINCT county FROM leads WHERE county IS NOT NULL ORDER BY county"
    ).fetchall()
    return [r["county"] for r in rows]


@app.get("/api/leads/export")
def export_leads_csv(
    stage: Optional[str] = None,
    starred: Optional[int] = None,
):
    """Export leads as CSV download."""
    conditions = []
    params = []
    if stage:
        conditions.append("stage = ?")
        params.append(stage)
    if starred is not None:
        conditions.append("starred = ?")
        params.append(starred)

    where = " WHERE " + " AND ".join(conditions) if conditions else ""
    rows = get_db().execute(f"SELECT * FROM leads{where} ORDER BY created_at DESC", params).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    if rows:
        writer.writerow(rows[0].keys())
        for row in rows:
            writer.writerow(dict(row).values())

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=squareberry-leads-{datetime.now().strftime('%Y%m%d')}.csv"}
    )


@app.get("/api/leads/{lead_id}")
def get_lead(lead_id: int):
    row = get_db().execute("SELECT * FROM leads WHERE id = ?", [lead_id]).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Lead not found")
    return dict(row)


@app.post("/api/leads", status_code=201)
def create_lead(lead: LeadCreate):
    """Create a single lead."""
    if lead.email_date and lead.address:
        existing = get_db().execute(
            "SELECT id FROM leads WHERE address = ? AND email_date = ?",
            [lead.address, lead.email_date]
        ).fetchone()
        if existing:
            return JSONResponse(
                status_code=200,
                content={"id": existing["id"], "status": "duplicate", "message": "Lead already exists"}
            )

    cur = get_db().execute("""
        INSERT INTO leads (address, city, county, state, acreage, asking_price,
            price_per_acre, zoning, lot_yield, feasibility_rating, gross_profit_pct,
            max_land_price, listing_url, pdf_url, source, notes, stage, email_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        lead.address, lead.city, lead.county, lead.state, lead.acreage,
        lead.asking_price, lead.price_per_acre, lead.zoning, lead.lot_yield,
        lead.feasibility_rating, lead.gross_profit_pct, lead.max_land_price,
        lead.listing_url, lead.pdf_url, lead.source, lead.notes, lead.stage,
        lead.email_date
    ])
    get_db().commit()

    # Auto-create a report if pdf_url is present
    if lead.pdf_url:
        get_db().execute("""
            INSERT INTO reports (title, lead_id, pdf_url, listing_url, address, acreage, county, feasibility_rating, report_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'))
        """, [
            f"{lead.address} — Development Analysis",
            cur.lastrowid, lead.pdf_url, lead.listing_url,
            lead.address, lead.acreage, lead.county, lead.feasibility_rating
        ])
        get_db().commit()

    # Update alert match counts
    _update_alert_matches_for_lead(lead)

    return {"id": cur.lastrowid, "status": "created"}


@app.post("/api/leads/bulk", status_code=201)
def create_leads_bulk(payload: BulkLeadCreate):
    """Create multiple leads at once (used by daily email cron)."""
    created = []
    duplicates = []
    for lead in payload.leads:
        if lead.email_date and lead.address:
            existing = get_db().execute(
                "SELECT id FROM leads WHERE address = ? AND email_date = ?",
                [lead.address, lead.email_date]
            ).fetchone()
            if existing:
                duplicates.append(lead.address)
                continue

        cur = get_db().execute("""
            INSERT INTO leads (address, city, county, state, acreage, asking_price,
                price_per_acre, zoning, lot_yield, feasibility_rating, gross_profit_pct,
                max_land_price, listing_url, pdf_url, source, notes, stage, email_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            lead.address, lead.city, lead.county, lead.state, lead.acreage,
            lead.asking_price, lead.price_per_acre, lead.zoning, lead.lot_yield,
            lead.feasibility_rating, lead.gross_profit_pct, lead.max_land_price,
            lead.listing_url, lead.pdf_url, lead.source, lead.notes, lead.stage,
            lead.email_date
        ])
        created.append({"id": cur.lastrowid, "address": lead.address})

        # Auto-create report if pdf_url present
        if lead.pdf_url:
            get_db().execute("""
                INSERT INTO reports (title, lead_id, pdf_url, listing_url, address, acreage, county, feasibility_rating, report_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'))
            """, [
                f"{lead.address} — Development Analysis",
                cur.lastrowid, lead.pdf_url, lead.listing_url,
                lead.address, lead.acreage, lead.county, lead.feasibility_rating
            ])

        # Update alert matches
        _update_alert_matches_for_lead(lead)

    get_db().commit()
    return {
        "created": len(created),
        "duplicates": len(duplicates),
        "leads": created
    }


@app.patch("/api/leads/{lead_id}")
def update_lead(lead_id: int, updates: LeadUpdate):
    """Update a lead's stage, notes, or other fields."""
    row = get_db().execute("SELECT * FROM leads WHERE id = ?", [lead_id]).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Lead not found")

    update_fields = []
    update_values = []
    for field, value in updates.model_dump(exclude_none=True).items():
        update_fields.append(f"{field} = ?")
        update_values.append(value)

    if not update_fields:
        return dict(row)

    update_fields.append("updated_at = datetime('now')")
    update_values.append(lead_id)

    get_db().execute(
        f"UPDATE leads SET {', '.join(update_fields)} WHERE id = ?",
        update_values
    )
    get_db().commit()

    return dict(get_db().execute("SELECT * FROM leads WHERE id = ?", [lead_id]).fetchone())


@app.post("/api/leads/bulk-stage")
def bulk_update_stage(payload: BulkStageUpdate):
    """Move multiple leads to a new stage at once."""
    updated = 0
    for lid in payload.lead_ids:
        result = get_db().execute(
            "UPDATE leads SET stage = ?, updated_at = datetime('now') WHERE id = ?",
            [payload.stage, lid]
        )
        updated += result.rowcount
    get_db().commit()
    return {"updated": updated, "stage": payload.stage}


@app.delete("/api/leads/{lead_id}")
def delete_lead(lead_id: int):
    row = get_db().execute("SELECT id FROM leads WHERE id = ?", [lead_id]).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Lead not found")
    get_db().execute("DELETE FROM leads WHERE id = ?", [lead_id])
    get_db().commit()
    return {"deleted": lead_id}


# ══════════════════════════════════════════════════════════════════════════════
# ── Alert Routes ──
# ══════════════════════════════════════════════════════════════════════════════

def _update_alert_matches_for_lead(lead):
    """When a new lead comes in, check all active alerts and bump match counts."""
    alerts = get_db().execute("SELECT * FROM alerts WHERE active = 1").fetchall()
    for alert in alerts:
        matches = True
        if alert["county"] and lead.county:
            if alert["county"].lower() not in lead.county.lower():
                matches = False
        if alert["min_acreage"] is not None and lead.acreage is not None:
            if lead.acreage < alert["min_acreage"]:
                matches = False
        if alert["max_acreage"] is not None and lead.acreage is not None:
            if lead.acreage > alert["max_acreage"]:
                matches = False
        if alert["max_price"] is not None and lead.asking_price is not None:
            if lead.asking_price > alert["max_price"]:
                matches = False
        if alert["zoning_filter"] and alert["zoning_filter"] != "Any Residential" and lead.zoning:
            # Filter like "R-1 Only" → check if zoning starts with "R-1"
            z = alert["zoning_filter"].replace(" Only", "")
            if not lead.zoning.upper().startswith(z.upper()):
                matches = False
        if matches:
            get_db().execute(
                "UPDATE alerts SET new_matches = new_matches + 1, last_checked = datetime('now') WHERE id = ?",
                [alert["id"]]
            )


@app.get("/api/alerts")
def list_alerts():
    rows = get_db().execute("SELECT * FROM alerts ORDER BY created_at DESC").fetchall()
    return [dict(r) for r in rows]


@app.post("/api/alerts", status_code=201)
def create_alert(alert: AlertCreate):
    cur = get_db().execute("""
        INSERT INTO alerts (county, min_acreage, max_acreage, max_price, zoning_filter, criteria_display, last_checked)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    """, [
        alert.county, alert.min_acreage, alert.max_acreage,
        alert.max_price, alert.zoning_filter, alert.criteria_display
    ])
    get_db().commit()
    return {"id": cur.lastrowid, "status": "created"}


@app.patch("/api/alerts/{alert_id}")
def update_alert(alert_id: int, updates: AlertUpdate):
    row = get_db().execute("SELECT * FROM alerts WHERE id = ?", [alert_id]).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Alert not found")

    update_fields = []
    update_values = []
    for field, value in updates.model_dump(exclude_none=True).items():
        update_fields.append(f"{field} = ?")
        update_values.append(value)

    if not update_fields:
        return dict(row)

    update_values.append(alert_id)
    get_db().execute(
        f"UPDATE alerts SET {', '.join(update_fields)} WHERE id = ?",
        update_values
    )
    get_db().commit()
    return dict(get_db().execute("SELECT * FROM alerts WHERE id = ?", [alert_id]).fetchone())


@app.delete("/api/alerts/{alert_id}")
def delete_alert(alert_id: int):
    row = get_db().execute("SELECT id FROM alerts WHERE id = ?", [alert_id]).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Alert not found")
    get_db().execute("DELETE FROM alerts WHERE id = ?", [alert_id])
    get_db().commit()
    return {"deleted": alert_id}


@app.post("/api/alerts/{alert_id}/reset")
def reset_alert_matches(alert_id: int):
    """Reset the new_matches counter (when user views matches)."""
    row = get_db().execute("SELECT id FROM alerts WHERE id = ?", [alert_id]).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Alert not found")
    get_db().execute("UPDATE alerts SET new_matches = 0, last_checked = datetime('now') WHERE id = ?", [alert_id])
    get_db().commit()
    return {"reset": alert_id}


# ══════════════════════════════════════════════════════════════════════════════
# ── Report Routes ──
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/reports")
def list_reports():
    rows = get_db().execute("SELECT * FROM reports ORDER BY created_at DESC").fetchall()
    return [dict(r) for r in rows]


@app.post("/api/reports", status_code=201)
def create_report(report: ReportCreate):
    cur = get_db().execute("""
        INSERT INTO reports (title, lead_id, pdf_url, listing_url, address, acreage, county, feasibility_rating, file_size, report_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        report.title, report.lead_id, report.pdf_url, report.listing_url,
        report.address, report.acreage, report.county, report.feasibility_rating,
        report.file_size, report.report_date or datetime.now().strftime('%Y-%m-%d')
    ])
    get_db().commit()
    return {"id": cur.lastrowid, "status": "created"}


@app.get("/api/reports/{report_id}")
def get_report(report_id: int):
    row = get_db().execute("SELECT * FROM reports WHERE id = ?", [report_id]).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Report not found")
    return dict(row)


@app.delete("/api/reports/{report_id}")
def delete_report(report_id: int):
    row = get_db().execute("SELECT id FROM reports WHERE id = ?", [report_id]).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Report not found")
    get_db().execute("DELETE FROM reports WHERE id = ?", [report_id])
    get_db().commit()
    return {"deleted": report_id}


# ══════════════════════════════════════════════════════════════════════════════
# ── Settings Routes ──
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/settings")
def get_settings():
    """Get all settings as a flat dict."""
    rows = get_db().execute("SELECT key, value FROM settings").fetchall()
    result = {}
    for r in rows:
        # Try to parse JSON values
        try:
            result[r["key"]] = json.loads(r["value"])
        except (json.JSONDecodeError, TypeError):
            result[r["key"]] = r["value"]
    return result


@app.put("/api/settings")
def save_settings(payload: SettingsPayload):
    """Save all settings (upsert each key)."""
    for key, value in payload.settings.items():
        # Store as JSON string for complex types, plain string for simple
        stored_value = json.dumps(value) if isinstance(value, (list, dict, bool)) else str(value)
        get_db().execute("""
            INSERT INTO settings (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')
        """, [key, stored_value, stored_value])
    get_db().commit()
    return {"status": "saved", "keys": list(payload.settings.keys())}


# ══════════════════════════════════════════════════════════════════════════════
# ── Stats & Health ──
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/stats")
def pipeline_stats():
    """Dashboard stats."""
    total = get_db().execute("SELECT COUNT(*) as c FROM leads").fetchone()["c"]
    by_stage = get_db().execute(
        "SELECT stage, COUNT(*) as count FROM leads GROUP BY stage"
    ).fetchall()
    total_value = get_db().execute(
        "SELECT COALESCE(SUM(asking_price), 0) as total FROM leads"
    ).fetchone()["total"]
    total_acres = get_db().execute(
        "SELECT COALESCE(SUM(acreage), 0) as total FROM leads"
    ).fetchone()["total"]
    starred = get_db().execute(
        "SELECT COUNT(*) as c FROM leads WHERE starred = 1"
    ).fetchone()["c"]
    total_alerts = get_db().execute("SELECT COUNT(*) as c FROM alerts WHERE active = 1").fetchone()["c"]
    total_reports = get_db().execute("SELECT COUNT(*) as c FROM reports").fetchone()["c"]

    return {
        "total_leads": total,
        "by_stage": {r["stage"]: r["count"] for r in by_stage},
        "total_value": total_value,
        "total_acres": round(total_acres, 1),
        "starred": starred,
        "active_alerts": total_alerts,
        "total_reports": total_reports
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0", "timestamp": datetime.now(timezone.utc).isoformat()}


# ══════════════════════════════════════════════════════════════════════════════
# ── Error Handlers ──
# ══════════════════════════════════════════════════════════════════════════════

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"error": "Validation error", "detail": "Invalid input data"}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )


# ── Static file serving ──
# Serve static frontend files (CSS, JS, images) from the same directory
STATIC_DIR = os.path.dirname(os.path.abspath(__file__))

# Static file extensions to serve
_STATIC_EXTENSIONS = {
    '.html', '.css', '.js', '.json',
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp',
    '.woff', '.woff2', '.ttf', '.eot',
    '.webmanifest',
}

@app.get("/{path:path}")
async def serve_static(path: str):
    """Serve static frontend files. Falls back to index.html for SPA routing."""
    if not path or path == "/":
        path = "index.html"

    # Security: prevent directory traversal
    safe_path = os.path.normpath(os.path.join(STATIC_DIR, path))
    if not safe_path.startswith(STATIC_DIR):
        raise HTTPException(status_code=403, detail="Forbidden")

    if os.path.isfile(safe_path):
        ext = os.path.splitext(safe_path)[1].lower()
        if ext in _STATIC_EXTENSIONS:
            content_types = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.ico': 'image/x-icon',
                '.svg': 'image/svg+xml',
                '.webp': 'image/webp',
                '.woff': 'font/woff',
                '.woff2': 'font/woff2',
                '.ttf': 'font/ttf',
                '.webmanifest': 'application/manifest+json',
            }
            return FileResponse(safe_path, media_type=content_types.get(ext, 'application/octet-stream'))

    # Fallback to index.html for SPA-style routing
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path, media_type='text/html')

    raise HTTPException(status_code=404, detail="Not found")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
