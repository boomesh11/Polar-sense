-- PolarSense Production Schema for PostgreSQL 15+ and TimescaleDB 2.x
-- Team AQUA LEAGUE · SIH 2026 · PS 26065
--
-- NOTE: Documented production setup. For local development / evaluation without PostgreSQL,
-- ground/ingest/app.py automatically uses an embedded SQLite database.

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Floats Metadata & Identity
CREATE TABLE IF NOT EXISTS floats (
    float_id        SMALLINT PRIMARY KEY,
    wmo_number      VARCHAR(10) UNIQUE,
    deployment_date TIMESTAMPTZ,
    region          VARCHAR(64),
    status          VARCHAR(32) DEFAULT 'active'
);

-- Ingested 340-byte Iridium SBD Telemetry Frames
CREATE TABLE IF NOT EXISTS telemetry_frames (
    id              BIGSERIAL PRIMARY KEY,
    float_id        SMALLINT NOT NULL REFERENCES floats(float_id),
    cycle           INTEGER NOT NULL,
    received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    observation_time TIMESTAMPTZ NOT NULL,
    ice_state       SMALLINT NOT NULL,  -- 0=clear, 1=unknown, 2=blocked
    qc_ok           BOOLEAN NOT NULL DEFAULT TRUE,
    gps_fix         BOOLEAN NOT NULL DEFAULT TRUE,
    lat_deg         DOUBLE PRECISION,
    lon_deg         DOUBLE PRECISION,
    sample_count    INTEGER,
    crc_valid       BOOLEAN NOT NULL,
    hmac_valid      BOOLEAN NOT NULL,
    raw_hex         TEXT NOT NULL,
    CONSTRAINT uq_float_cycle UNIQUE (float_id, cycle)
);

-- TimescaleDB Hypertable for Oceanographic Profile Levels
CREATE TABLE IF NOT EXISTS profile_levels (
    time            TIMESTAMPTZ NOT NULL,
    float_id        SMALLINT NOT NULL REFERENCES floats(float_id),
    cycle           INTEGER NOT NULL,
    depth_dbar      REAL NOT NULL,
    temp_c          REAL NOT NULL,
    psal_psu        REAL NOT NULL,
    doxy_umol       REAL,
    temp_qc         SMALLINT DEFAULT 1,
    psal_qc         SMALLINT DEFAULT 1,
    overall_qc      SMALLINT DEFAULT 1
);

SELECT create_hypertable('profile_levels', 'time', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_profile_float_cycle ON profile_levels (float_id, cycle);

-- Technical Housekeeping Telemetry
CREATE TABLE IF NOT EXISTS technical_telemetry (
    time            TIMESTAMPTZ NOT NULL,
    float_id        SMALLINT NOT NULL REFERENCES floats(float_id),
    pack_voltage_v  REAL,
    humidity_pct    REAL,
    flash_used_pct  REAL,
    pump_cycles     INTEGER
);

SELECT create_hypertable('technical_telemetry', 'time', if_not_exists => TRUE);
