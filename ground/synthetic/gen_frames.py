"""
gen_frames.py — Generates SYNTHETIC 340-byte binary test frames for PolarSense.
Team AQUA LEAGUE · SIH 2026 · PS 26065

NOTE: ALL DATA GENERATED HERE IS STRICTLY SYNTHETIC.
Output files are stored in ground/synthetic/frames/ and labelled SYNTHETIC.
"""
import os
import sys
from pathlib import Path

# Add ground parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ingest.frame import TelemetryFrame, CTDSample, encode_frame

HMAC_KEY = b"default_secret_hmac_key_32_bytes!"
OUTPUT_DIR = Path(__file__).parent / "frames"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def generate_synthetic_samples() -> list:
    """Generates physically plausible Southern Ocean profile levels (SYNTHETIC)."""
    profile_data = [
        (4.2, -0.85, 33.88),
        (15.0, -0.92, 33.91),
        (30.0, -1.15, 33.94),
        (50.0, -1.45, 34.02),
        (75.0, -1.68, 34.15),
        (100.0, -1.72, 34.28),
        (150.0, -0.45, 34.48),
        (200.0, 0.82, 34.62),
        (250.0, 1.34, 34.69),
        (300.0, 1.58, 34.73),
        (350.0, 1.65, 34.75),
        (400.0, 1.62, 34.76),
        (450.0, 1.55, 34.76),
        (498.2, 1.48, 34.77)
    ]
    return [CTDSample(depth_dbar=d, temp_c=t, psal_psu=s) for d, t, s in profile_data]

def create_synthetic_frames():
    test_cases = [
        {"float_id": 1, "cycle": 14, "ts": 1756200000, "ice": 0, "lat": -58.42, "lon": 42.19, "label": "SYNTHETIC_open_water"},
        {"float_id": 1, "cycle": 15, "ts": 1757064000, "ice": 1, "lat": -58.55, "lon": 42.30, "label": "SYNTHETIC_ice_unknown"},
        {"float_id": 2, "cycle": 19, "ts": 1756200000, "ice": 2, "lat": -64.12, "lon": -52.40, "label": "SYNTHETIC_ice_blocked"},
    ]

    generated_files = []
    for tc in test_cases:
        frame = TelemetryFrame(
            float_id=tc["float_id"],
            cycle=tc["cycle"],
            timestamp=tc["ts"],
            ice_state=tc["ice"],
            qc_ok=True,
            gps_fix=(tc["ice"] == 0),
            lat_deg=tc["lat"],
            lon_deg=tc["lon"],
            samples=generate_synthetic_samples()
        )
        raw_bytes = encode_frame(frame, HMAC_KEY)
        out_name = f"frame_PS{tc['float_id']:02d}_cyc{tc['cycle']:03d}_{tc['label']}.bin"
        out_path = OUTPUT_DIR / out_name
        out_path.write_bytes(raw_bytes)
        generated_files.append(out_path)
        print(f"[SYNTHETIC] Created {out_name} ({len(raw_bytes)} bytes)")

    return generated_files

if __name__ == "__main__":
    print("Generating SYNTHETIC 340-byte test frames...")
    files = create_synthetic_frames()
    print(f"Successfully generated {len(files)} SYNTHETIC frames in {OUTPUT_DIR}")
