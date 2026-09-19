# PolarSense Ground Station Ingest Service

FastAPI service for receiving, authenticating, decoding, and archiving 340-byte Iridium SBD binary frames transmitted by PolarSense profiling floats.

**TRL 4 Status: Functional prototype running on SYNTHETIC telemetry frames and lab test data.**

## Capabilities

1. **Binary Frame Ingest**: Decodes 340-byte compressed telemetry packets.
2. **Integrity & Security**: Verifies IEEE 802.3 CRC-32 checksum and 96-bit truncated HMAC-SHA-256 signature.
3. **Argo RTQC Engine**: Automatically applies real-time QC tests (Flags 1-4) for global ranges, spike anomalies, and pressure inversions.
4. **Storage Architecture**:
   - **Production**: PostgreSQL 15+ and TimescaleDB 2.x hypertable (see `db/schema.sql`).
   - **Local Evaluation / Fallback**: Automatic zero-configuration SQLite fallback when `POLARSENSE_DATABASE_URL` is omitted.
5. **Argo NetCDF Export**: Exports CF/Argo-compliant NetCDF files (`PROF` mode) using `netCDF4`.

## Running the Ingest API

Install dependencies:
```bash
cd ground
pip install -r requirements.txt
```

Launch FastAPI server:
```bash
uvicorn ingest.app:app --reload --port 8000
```
Interactive OpenAPI documentation will be available at `http://localhost:8000/docs`.

## Running the Unit Tests

Execute the round-trip encoding, decoding, and QC test suite:
```bash
pytest ground/tests/ -v
# Or with py launcher:
py -3 -m pytest ground/tests/ -v
```

## Generating SYNTHETIC Test Telemetry

To generate a set of test binary frames simulating open-water, unknown echo, and under-ice scenarios:
```bash
python ground/synthetic/gen_frames.py
```
Generated frames are placed in `ground/synthetic/frames/` and explicitly marked **SYNTHETIC**.
