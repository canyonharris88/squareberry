#!/usr/bin/env python3
"""Download binary assets if they're missing or placeholder-sized.
Run this before starting the server: python setup_assets.py
"""
import urllib.request
import os
import base64

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Assets with their expected minimum sizes (to detect placeholders)
ASSETS = {
    "favicon.png": 2000,
    "logo-sidebar.png": 4000,
    "logo-180.png": 40000,
    "logo-192.png": 45000,
    "logo-512.png": 300000,
    "logo-instagram.jpg": 150000,
    "logo.png": 500000,
}

# Base URL for downloading assets (from Perplexity deployment)
BASE_URL = "https://sites.pplx.app/sites/proxy/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcmVmaXgiOiJ3ZWIvZGlyZWN0LWZpbGVzL2NvbXB1dGVyLzBlNWU0YWY2LWUwYzEtNDA3ZC05Y2VjLTFkMWFiOTU1OGJiYS9zcXVhcmViZXJyeS1hcHAvIiwic2lkIjoiMGU1ZTRhZjYtZTBjMS00MDdkLTljZWMtMWQxYWI5NTU4YmJhIiwiZXhwIjoxNzcyNzU4NTAyfQ.LFhCKWxsLyTokKHcl8_BeHHnWNltgP1XutKH03meRt0/web/direct-files/computer/0e5e4af6-e0c1-407d-9cec-1d1ab9558bba/squareberry-app"

def download_asset(filename, min_size):
    filepath = os.path.join(SCRIPT_DIR, filename)
    
    # Check if file exists and is real (not a placeholder)
    if os.path.exists(filepath) and os.path.getsize(filepath) >= min_size:
        print(f"  {filename}: OK ({os.path.getsize(filepath)} bytes)")
        return True
    
    url = f"{BASE_URL}/{filename}"
    try:
        print(f"  {filename}: downloading...")
        urllib.request.urlretrieve(url, filepath)
        size = os.path.getsize(filepath)
        if size < min_size:
            print(f"  {filename}: WARNING - downloaded file too small ({size} bytes)")
            return False
        print(f"  {filename}: OK ({size} bytes)")
        return True
    except Exception as e:
        print(f"  {filename}: FAILED - {e}")
        return False

def init_db():
    """Initialize pipeline.db if missing or empty."""
    import sqlite3
    db_path = os.path.join(SCRIPT_DIR, "pipeline.db")
    if os.path.exists(db_path) and os.path.getsize(db_path) > 100:
        print(f"  pipeline.db: OK ({os.path.getsize(db_path)} bytes)")
        return
    
    print("  pipeline.db: initializing fresh database...")
    # Import and run init from api_server
    import importlib.util
    spec = importlib.util.spec_from_file_location("api_server", os.path.join(SCRIPT_DIR, "api_server.py"))
    mod = importlib.util.module_from_spec(spec)
    # Don't actually load the full module, just create the DB
    import sqlite3
    db = sqlite3.connect(db_path)
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
            stage TEXT DEFAULT 'new_lead',
            starred INTEGER DEFAULT 0,
            notes TEXT,
            listing_url TEXT,
            pdf_url TEXT,
            source TEXT,
            email_date TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            county TEXT,
            min_acreage REAL,
            max_price_per_acre REAL,
            zoning TEXT,
            active INTEGER DEFAULT 1,
            match_count INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id INTEGER,
            title TEXT NOT NULL,
            pdf_url TEXT,
            notes TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
        );
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at TEXT DEFAULT (datetime('now'))
        );
    """)
    db.commit()
    db.close()
    print(f"  pipeline.db: created ({os.path.getsize(db_path)} bytes)")

if __name__ == "__main__":
    print("SquareBerry Asset Setup")
    print("=" * 40)
    
    print("\nChecking image assets...")
    for filename, min_size in ASSETS.items():
        download_asset(filename, min_size)
    
    print("\nChecking database...")
    init_db()
    
    print("\nSetup complete!")
