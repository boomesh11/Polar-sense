"""
physics.py — PolarSense design-figure computation.
Team AQUA LEAGUE · SIH 2026 · PS 26065

All inputs are the locked DESIGN FIGURES. Results are CALCULATED.
Outputs are printed with their inputs and units for traceability.
"""
import math

# ── Locked design inputs ──────────────────────────────────────────────
HULL_LENGTH_MM = 1300          # mm
HULL_OD_MM = 160               # mm outer diameter
SEAWATER_DENSITY = 1.027       # kg/L (1027 kg/m³)
NEUTRAL_MASS_KG = 25.75        # kg
BUOYANCY_STROKE_ML = 650       # ml hydraulic oil engine
USABLE_ENERGY_WH = 919         # Wh
CYCLE_ENERGY_WH = 5.30         # Wh per 10-day cycle
MISSION_CYCLE_DAYS = 10        # days
CLAIMED_PROFILES = 128         # profiles
CLAIMED_LIFE_YRS = 3.5         # years


def compute_displacement():
    """
    Displacement volume and mass of displaced seawater for hull cylinder.
    """
    radius_m = (HULL_OD_MM / 2.0) / 1000.0
    length_m = HULL_LENGTH_MM / 1000.0
    vol_m3 = math.pi * (radius_m ** 2) * length_m
    vol_litres = vol_m3 * 1000.0
    displaced_mass_kg = vol_litres * SEAWATER_DENSITY

    print("== 1. Displacement and Hull Geometry [CALCULATED] ==")
    print(f"  Hull OD              : {HULL_OD_MM} mm")
    print(f"  Hull Length          : {HULL_LENGTH_MM} mm")
    print(f"  Displaced Volume     : {vol_litres:.2f} L")
    print(f"  Seawater Density     : {SEAWATER_DENSITY:.3f} kg/L")
    print(f"  Displaced Mass (H2O) : {displaced_mass_kg:.2f} kg")
    print(f"  Target Neutral Mass  : {NEUTRAL_MASS_KG:.2f} kg [TARGET]")
    print()
    return vol_litres, displaced_mass_kg


def compute_lift():
    """
    Net buoyancy lift from the 650 ml stroke.
    """
    lift_kg = (BUOYANCY_STROKE_ML / 1000.0) * SEAWATER_DENSITY
    lift_n = lift_kg * 9.80665

    print("== 2. Buoyancy Engine Lift [CALCULATED] ==")
    print(f"  Stroke Volume        : {BUOYANCY_STROKE_ML} ml")
    print(f"  Net Buoyancy Lift    : {lift_kg:.4f} kg ({lift_n:.2f} N)")
    print()
    return lift_kg


def compute_energy_budget():
    """
    Energy budget and endurance calculations.
    """
    cycles = USABLE_ENERGY_WH / CYCLE_ENERGY_WH  # 919 / 5.30 = 173.396 -> 173 cycles
    open_water_days = cycles * MISSION_CYCLE_DAYS
    open_water_years = open_water_days / 365.25

    # Severe ice life figure from design documentation: 3.95 years
    severe_ice_years = 3.95

    print("== 3. Energy Budget & Mission Life [CALCULATED / TARGET] ==")
    print(f"  Usable Battery Energy: {USABLE_ENERGY_WH} Wh [TARGET]")
    print(f"  Energy per Cycle     : {CYCLE_ENERGY_WH:.2f} Wh [TARGET]")
    print(f"  Available Cycles     : {cycles:.1f} (rounds to {round(cycles)}) [CALCULATED]")
    print(f"  Open Water Life      : {open_water_years:.2f} years (~4.7 years) [CALCULATED]")
    print(f"  Severe Ice Life      : {severe_ice_years:.2f} years [TARGET]")
    print(f"  Claimed Mission Life : {CLAIMED_LIFE_YRS} years (~{CLAIMED_PROFILES} profiles) [TARGET]")
    print()
    return cycles, open_water_years


if __name__ == "__main__":
    print("PolarSense Physics & Numbers Twin")
    print("TRL 4 — Analytical scripts (No field qualification claims)")
    print("=" * 60)
    compute_displacement()
    compute_lift()
    compute_energy_budget()
