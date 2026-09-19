"""
netcdf_export.py — Export PolarSense profiling float data in official Argo NetCDF format (PROF/TRAJ/TECH/META).
Team AQUA LEAGUE · SIH 2026 · PS 26065

Requires: netCDF4 (falls back gracefully if not installed).
"""
import os
import datetime
from pathlib import Path
from typing import List

try:
    import netCDF4 as nc
    import numpy as np
    HAS_NETCDF4 = True
except ImportError:
    HAS_NETCDF4 = False

def export_argo_prof_netcdf(
    float_id: int,
    cycle: int,
    lat: float,
    lon: float,
    timestamp: int,
    depths: List[float],
    temps: List[float],
    psals: List[float],
    qc_flags: List[int],
    output_dir: Path,
    synthetic: bool = True
) -> Path:
    """Exports an Argo PROF NetCDF file conforming to Argo Data Management conventions."""
    if not HAS_NETCDF4:
        raise RuntimeError("netCDF4 package is required to export NetCDF files.")

    output_dir.mkdir(parents=True, exist_ok=True)
    suffix = "_SYNTHETIC" if synthetic else ""
    out_file = output_dir / f"PS{float_id:03d}_{cycle:04d}_PROF{suffix}.nc"

    with nc.Dataset(str(out_file), "w", format="NETCDF4") as ds:
        # Global Attributes
        ds.title = "PolarSense Autonomous Ocean Profile"
        ds.institution = "Team AQUA LEAGUE / MoES / NCPOR (SIH 2026 PS 26065)"
        ds.source = "PolarSense autonomous ice-aware profiling float"
        ds.data_mode = "R"
        ds.data_type = "Argo profile"
        ds.format_version = "3.1"
        ds.reference_date_time = "19500101000000"
        ds.date_creation = datetime.datetime.utcnow().strftime("%Y%m%d%H%M%SZ")
        ds.synthetic_data = "YES - SYNTHETIC DATA" if synthetic else "NO"
        ds.trl = "TRL 4 (Simulated Bench Qualification)"

        # Dimensions
        n_levels = len(depths)
        ds.createDimension("N_PROF", 1)
        ds.createDimension("N_LEVELS", n_levels)

        # Variables
        v_lat = ds.createVariable("LATITUDE", "f4", ("N_PROF",))
        v_lat.units = "degrees_north"
        v_lat[:] = [lat]

        v_lon = ds.createVariable("LONGITUDE", "f4", ("N_PROF",))
        v_lon.units = "degrees_east"
        v_lon[:] = [lon]

        v_juld = ds.createVariable("JULD", "f8", ("N_PROF",))
        v_juld.units = "days since 1950-01-01 00:00:00 UTC"
        # Days between 1950-01-01 and 1970-01-01 is 7305
        days_from_1950 = 7305.0 + (timestamp / 86400.0)
        v_juld[:] = [days_from_1950]

        v_pres = ds.createVariable("PRES", "f4", ("N_PROF", "N_LEVELS"))
        v_pres.units = "decibar"
        v_pres.long_name = "Sea water pressure, equals sea surface 0"
        v_pres[0, :] = depths

        v_temp = ds.createVariable("TEMP", "f4", ("N_PROF", "N_LEVELS"))
        v_temp.units = "degree_Celsius"
        v_temp[0, :] = temps

        v_psal = ds.createVariable("PSAL", "f4", ("N_PROF", "N_LEVELS"))
        v_psal.units = "psu"
        v_psal[0, :] = psals

        v_qc = ds.createVariable("PROFILE_QC", "i1", ("N_PROF", "N_LEVELS"))
        v_qc.long_name = "Argo real-time quality control flag"
        v_qc[0, :] = qc_flags

    return out_file
