"""
frame.py — PolarSense 340-byte Iridium SBD binary frame encoder & decoder.
Team AQUA LEAGUE · SIH 2026 · PS 26065

Frame Architecture (340 bytes total):
- Header (24 bytes):
    Magic (2B, 0xA7F3), Version (1B), Float ID (1B), Cycle (4B uint32),
    Timestamp (4B uint32), Flags (2B), GPS Lat/Lon (6B, 24-bit 0.0001 deg),
    Reserved (4B)
- Payload (300 bytes):
    Up to 60 CTD samples (5 bytes each: depth uint16 0.5 dbar, temp int16 0.001 C, sal uint8 compressed)
- Checksum & Auth (16 bytes):
    CRC-32 (4B IEEE 802.3) + HMAC-SHA-256 (12B truncated to 96-bit)
"""
import struct
import binascii
import hmac
import hashlib
from dataclasses import dataclass, field
from typing import List, Tuple

FRAME_MAGIC = 0xA7F3
FRAME_VERSION = 0x03
FRAME_SIZE = 340
HEADER_SIZE = 24
PAYLOAD_SIZE = 300
CRC_SIZE = 4
HMAC_SIZE = 12
MAX_SAMPLES = 60

@dataclass
class CTDSample:
    depth_dbar: float
    temp_c: float
    psal_psu: float

@dataclass
class TelemetryFrame:
    float_id: int
    cycle: int
    timestamp: int
    ice_state: int      # 0=clear, 1=unknown, 2=blocked
    qc_ok: bool = True
    gps_fix: bool = True
    lat_deg: float = 0.0
    lon_deg: float = 0.0
    samples: List[CTDSample] = field(default_factory=list)
    crc_valid: bool = True
    hmac_valid: bool = True

def _pack_sample(sample: CTDSample) -> bytes:
    d_raw = max(0, min(65535, int(round(sample.depth_dbar / 0.5))))
    t_raw = max(-32768, min(32767, int(round(sample.temp_c / 0.001))))
    # Salinity offset compression: (psu - 20) / 0.2 -> 0..100 stored in 1 byte
    s_raw = max(0, min(255, int(round((sample.psal_psu - 20.0) / 0.2))))
    return struct.pack(">HhB", d_raw, t_raw, s_raw)

def _unpack_sample(data: bytes) -> CTDSample:
    d_raw, t_raw, s_raw = struct.unpack(">HhB", data)
    return CTDSample(
        depth_dbar=round(d_raw * 0.5, 1),
        temp_c=round(t_raw * 0.001, 3),
        psal_psu=round((s_raw * 0.2) + 20.0, 3)
    )

def encode_frame(frame: TelemetryFrame, hmac_key: bytes) -> bytes:
    """Encodes a TelemetryFrame into a strictly-sized 340-byte binary packet."""
    flags = ((frame.ice_state & 0x03) << 6) | ((1 if frame.qc_ok else 0) << 1) | (1 if frame.gps_fix else 0)

    lat_raw = int(round(frame.lat_deg / 0.0001))
    lon_raw = int(round(frame.lon_deg / 0.0001))

    def pack_int24(v: int) -> bytes:
        v = v & 0xFFFFFF
        return bytes([(v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF])

    hdr = struct.pack(">HBBIIH", FRAME_MAGIC, FRAME_VERSION, frame.float_id, frame.cycle, frame.timestamp, flags)
    hdr += pack_int24(lat_raw)
    hdr += pack_int24(lon_raw)
    hdr += b"\x00\x00\x00\x00"  # 4 bytes reserved
    assert len(hdr) == HEADER_SIZE

    payload = bytearray(PAYLOAD_SIZE)
    for idx, s in enumerate(frame.samples[:MAX_SAMPLES]):
        payload[idx * 5 : (idx + 1) * 5] = _pack_sample(s)

    body = hdr + bytes(payload)  # 324 bytes

    # IEEE 802.3 CRC-32
    crc_val = binascii.crc32(body) & 0xFFFFFFFF
    body_with_crc = body + struct.pack(">I", crc_val)  # 328 bytes

    # HMAC-SHA-256 truncated to 96 bits (12 bytes)
    mac = hmac.new(hmac_key, body_with_crc, hashlib.sha256).digest()[:HMAC_SIZE]
    frame_bytes = body_with_crc + mac

    assert len(frame_bytes) == FRAME_SIZE, f"Encoded frame size {len(frame_bytes)} != 340"
    return frame_bytes

def decode_frame(raw_bytes: bytes, hmac_key: bytes) -> TelemetryFrame:
    """Decodes a 340-byte binary packet into a TelemetryFrame with integrity verification."""
    if len(raw_bytes) != FRAME_SIZE:
        raise ValueError(f"Invalid frame size: {len(raw_bytes)} (expected 340)")

    magic = struct.unpack(">H", raw_bytes[0:2])[0]
    if magic != FRAME_MAGIC:
        raise ValueError(f"Invalid frame magic: 0x{magic:04X}")

    # HMAC verification
    received_mac = raw_bytes[-HMAC_SIZE:]
    expected_mac = hmac.new(hmac_key, raw_bytes[:-HMAC_SIZE], hashlib.sha256).digest()[:HMAC_SIZE]
    hmac_valid = hmac.compare_digest(received_mac, expected_mac)

    # CRC verification
    received_crc = struct.unpack(">I", raw_bytes[324:328])[0]
    calculated_crc = binascii.crc32(raw_bytes[:324]) & 0xFFFFFFFF
    crc_valid = (received_crc == calculated_crc)

    # Header unpack
    _, version, float_id, cycle, timestamp, flags = struct.unpack(">HBBIIH", raw_bytes[0:14])

    def unpack_int24(b: bytes) -> int:
        val = (b[0] << 16) | (b[1] << 8) | b[2]
        if val & 0x800000:
            val -= 0x1000000
        return val

    lat_raw = unpack_int24(raw_bytes[14:17])
    lon_raw = unpack_int24(raw_bytes[17:20])

    ice_state = (flags >> 6) & 0x03
    qc_ok = bool((flags >> 1) & 0x01)
    gps_fix = bool(flags & 0x01)

    # Samples unpack
    samples = []
    payload_data = raw_bytes[HEADER_SIZE : HEADER_SIZE + PAYLOAD_SIZE]
    for idx in range(MAX_SAMPLES):
        chunk = payload_data[idx * 5 : (idx + 1) * 5]
        s = _unpack_sample(chunk)
        # End of padded samples check
        if s.depth_dbar == 0.0 and s.temp_c == 0.0 and idx > 0:
            break
        samples.append(s)

    return TelemetryFrame(
        float_id=float_id,
        cycle=cycle,
        timestamp=timestamp,
        ice_state=ice_state,
        qc_ok=qc_ok,
        gps_fix=gps_fix,
        lat_deg=round(lat_raw * 0.0001, 4),
        lon_deg=round(lon_raw * 0.0001, 4),
        samples=samples,
        crc_valid=crc_valid,
        hmac_valid=hmac_valid
    )
