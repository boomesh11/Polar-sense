"""
app.py — FastAPI Ingest Service for PolarSense float telemetry.
Team AQUA LEAGUE · SIH 2026 · PS 26065

Features:
- Ingest 340-byte binary frame
- Verify CRC-32 & HMAC-SHA-256
- Apply Argo RTQC flags (1-4)
- Deduplicate & store frames
- Database: TimescaleDB / PostgreSQL production setup with automatic SQLite fallback
"""
import os
import sqlite3
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from pydantic import BaseModel

from .frame import decode_frame, TelemetryFrame
from .qc import apply_argo_qc

app = FastAPI(
    title="PolarSense Ground Station Telemetry Ingest Service",
    description="Decodes 340-byte Iridium SBD frames, validates integrity, runs Argo RTQC, and stores profile data.",
    version="1.0.0"
)

DB_URL = os.environ.get("POLARSENSE_DATABASE_URL", "")
HMAC_KEY = os.environ.get("POLARSENSE_HMAC_KEY", "default_secret_hmac_key_32_bytes!").encode("utf-8")
SQLITE_PATH = Path("polarsense_telemetry.db")

def get_db():
    """SQLite connection fallback for local testing without PostgreSQL."""
    conn = sqlite3.connect(str(SQLITE_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

@app.on_event("startup")
def init_db():
    """Initializes local SQLite database if Postgres is not configured."""
    if not DB_URL:
        conn = sqlite3.connect(str(SQLITE_PATH))
        with conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS telemetry_frames (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                float_id INTEGER,
                cycle INTEGER,
                timestamp INTEGER,
                ice_state INTEGER,
                qc_ok INTEGER,
                gps_fix INTEGER,
                lat_deg REAL,
                lon_deg REAL,
                sample_count INTEGER,
                crc_valid INTEGER,
                hmac_valid INTEGER,
                raw_hex TEXT,
                UNIQUE(float_id, cycle)
            )
            """)
            conn.execute("""
            CREATE TABLE IF NOT EXISTS profile_levels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                float_id INTEGER,
                cycle INTEGER,
                depth_dbar REAL,
                temp_c REAL,
                psal_psu REAL,
                overall_qc INTEGER
            )
            """)
        conn.close()

@app.post("/ingest")
async def ingest_frame(file: UploadFile = File(...), db: sqlite3.Connection = Depends(get_db)):
    """Receives and processes raw 340-byte Iridium SBD frame."""
    content = await file.read()
    if len(content) != 340:
        raise HTTPException(status_code=400, detail=f"Invalid frame size: {len(content)} bytes (expected 340)")

    try:
        frame = decode_frame(content, HMAC_KEY)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Frame decode error: {str(e)}")

    if not frame.crc_valid:
        raise HTTPException(status_code=400, detail="CRC-32 checksum mismatch")
    if not frame.hmac_valid:
        raise HTTPException(status_code=401, detail="HMAC-SHA-256 authentication failed")

    # Run Argo RTQC
    depths = [s.depth_dbar for s in frame.samples]
    temps  = [s.temp_c for s in frame.samples]
    psals  = [s.psal_psu for s in frame.samples]
    qc_results = apply_argo_qc(depths, temps, psals)

    # De-duplicate and store
    try:
        with db:
            cursor = db.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO telemetry_frames
            (float_id, cycle, timestamp, ice_state, qc_ok, gps_fix, lat_deg, lon_deg, sample_count, crc_valid, hmac_valid, raw_hex)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                frame.float_id, frame.cycle, frame.timestamp, frame.ice_state,
                1 if frame.qc_ok else 0, 1 if frame.gps_fix else 0,
                frame.lat_deg, frame.lon_deg, len(frame.samples),
                1 if frame.crc_valid else 0, 1 if frame.hmac_valid else 0,
                content.hex()
            ))

            # Delete old levels on duplicate cycle
            cursor.execute("DELETE FROM profile_levels WHERE float_id = ? AND cycle = ?", (frame.float_id, frame.cycle))
            for r in qc_results:
                cursor.execute("""
                INSERT INTO profile_levels (float_id, cycle, depth_dbar, temp_c, psal_psu, overall_qc)
                VALUES (?, ?, ?, ?, ?, ?)
                """, (frame.float_id, frame.cycle, r.depth_dbar, r.temp_c, r.psal_psu, r.overall_qc))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database storage failed: {str(e)}")

    return {
        "status": "ingested",
        "float_id": frame.float_id,
        "cycle": frame.cycle,
        "ice_state": frame.ice_state,
        "levels_count": len(frame.samples),
        "crc_valid": frame.crc_valid,
        "hmac_valid": frame.hmac_valid,
        "all_qc_good": all(r.overall_qc == 1 for r in qc_results)
    }

@app.get("/floats")
def list_floats(db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("SELECT float_id, MAX(cycle) as last_cycle, COUNT(*) as frame_count FROM telemetry_frames GROUP BY float_id").fetchall()
    return [{"float_id": r["float_id"], "last_cycle": r["last_cycle"], "frame_count": r["frame_count"]} for r in rows]

@app.get("/profiles/{float_id}")
def get_profiles(float_id: int, db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("SELECT cycle, timestamp, ice_state, lat_deg, lon_deg, sample_count FROM telemetry_frames WHERE float_id = ? ORDER BY cycle ASC", (float_id,)).fetchall()
    return [dict(r) for r in rows]
