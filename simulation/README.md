# PolarSense Simulation & Verification Suite

Python scripts that recompute and strictly verify the PolarSense design deck numbers from first principles.
All outputs are tagged with either `CALCULATED` or `TARGET` — no field measurements are claimed.

**Project Status: TRL 4 (Analytical models & lab bench tests only; no pressure, cold or ocean qualification).**

## Scripts

| Script | Purpose | Status Tag |
|---|---|---|
| `check_deck_numbers.py` | Automated regression test asserting every single locked design figure | `CALCULATED` / `TARGET` |
| `physics.py` | Calculates displacement, buoyancy lift, energy budget, and endurance | `CALCULATED` |
| `cost_comparison.py` | Evaluates target and projected funding bands vs imported commercial floats | `TARGET` |

## Execution

To verify all design figures:
```bash
python simulation/check_deck_numbers.py
# Or with py launcher:
py -3 simulation/check_deck_numbers.py
```

To run the physics calculations:
```bash
python simulation/physics.py
```

To review the cost allowance comparison:
```bash
python simulation/cost_comparison.py
```
