"""
test_round_trip.py — Pytest suite verifying 340-byte binary frame round-trip,
integrity validation, and Argo RTQC classification.
Team AQUA LEAGUE · SIH 2026 · PS 26065

All test data is SYNTHETIC.
"""
import sys
from pathlib import Path
import pytest

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from ingest.frame import TelemetryFrame, CTDSample, encode_frame, decode_frame, FRAME_SIZE
from ingest.qc import apply_argo_qc

TEST_HMAC_KEY = b"test_hmac_secret_key_32_bytes!!"
WRONG_HMAC_KEY = b"wrong_hmac_secret_key_32_bytes!"

def create_synthetic_test_frame(ice_state: int = 0) -> TelemetryFrame:
    """Creates a sample TelemetryFrame containing SYNTHETIC profile data."""
    samples = [
        CTDSample(depth_dbar=4.2, temp_c=-0.85, psal_psu=33.88),
        CTDSample(depth_dbar=50.0, temp_c=-1.45, psal_psu=34.02),
        CTDSample(depth_dbar=150.0, temp_c=-0.45, psal_psu=34.48),
        CTDSample(depth_dbar=300.0, temp_c=1.58, psal_psu=34.73),
        CTDSample(depth_dbar=450.0, temp_c=1.55, psal_psu=34.76),
        CTDSample(depth_dbar=498.2, temp_c=1.48, psal_psu=34.77),
    ]
    return TelemetryFrame(
        float_id=1,
        cycle=14,
        timestamp=1756200000,
        ice_state=ice_state,
        qc_ok=True,
        gps_fix=True,
        lat_deg=-58.42,
        lon_deg=42.19,
        samples=samples
    )

def test_frame_size_is_exactly_340_bytes():
    frame = create_synthetic_test_frame()
    raw = encode_frame(frame, TEST_HMAC_KEY)
    assert len(raw) == FRAME_SIZE == 340

def test_round_trip_encode_decode():
    frame = create_synthetic_test_frame(ice_state=0)
    raw = encode_frame(frame, TEST_HMAC_KEY)
    decoded = decode_frame(raw, TEST_HMAC_KEY)

    assert decoded.float_id == frame.float_id
    assert decoded.cycle == frame.cycle
    assert decoded.timestamp == frame.timestamp
    assert decoded.ice_state == 0
    assert decoded.qc_ok is True
    assert decoded.gps_fix is True
    assert abs(decoded.lat_deg - (-58.42)) < 0.001
    assert abs(decoded.lon_deg - 42.19) < 0.001
    assert len(decoded.samples) == len(frame.samples)
    assert decoded.crc_valid is True
    assert decoded.hmac_valid is True

def test_ice_state_preservation():
    for state in [0, 1, 2]:
        frame = create_synthetic_test_frame(ice_state=state)
        raw = encode_frame(frame, TEST_HMAC_KEY)
        decoded = decode_frame(raw, TEST_HMAC_KEY)
        assert decoded.ice_state == state

def test_hmac_authentication_failure():
    frame = create_synthetic_test_frame()
    raw = encode_frame(frame, TEST_HMAC_KEY)
    decoded = decode_frame(raw, WRONG_HMAC_KEY)
    assert decoded.hmac_valid is False

def test_crc_checksum_failure():
    frame = create_synthetic_test_frame()
    raw = bytearray(encode_frame(frame, TEST_HMAC_KEY))
    # Corrupt 1 byte in payload
    raw[50] ^= 0xFF
    decoded = decode_frame(bytes(raw), TEST_HMAC_KEY)
    assert decoded.crc_valid is False

def test_argo_qc_flags():
    depths = [4.0, 50.0, 200.0, 450.0]
    temps  = [-0.8, -1.4, 0.8, 1.5]
    psals  = [33.9, 34.0, 34.6, 34.7]
    qc_res = apply_argo_qc(depths, temps, psals)
    assert all(r.overall_qc == 1 for r in qc_res)

def test_argo_qc_out_of_range():
    depths = [10.0, 50.0]
    temps = [65.0, -1.0] # 65 C is outside ocean range
    psals = [34.0, 34.0]
    qc_res = apply_argo_qc(depths, temps, psals)
    assert qc_res[0].temp_qc == 4
    assert qc_res[0].overall_qc == 4
    assert qc_res[1].overall_qc == 1
