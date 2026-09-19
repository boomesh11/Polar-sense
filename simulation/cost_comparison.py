"""
cost_comparison.py — PolarSense cost comparison and financial analysis.
Team AQUA LEAGUE · SIH 2026 · PS 26065

NOTE: These are funding allowances / projected bands, NOT supplier quotations.
Tagged TARGET per repository rules.
"""

TARGET_COST_INR = 825_000          # Rs 8.25 lakh per unit target
PROJECTED_LOW_INR = 825_000        # Rs 8.25 lakh
PROJECTED_HIGH_INR = 1_650_000     # Rs 16.5 lakh
IMPORTED_FLOAT_INR = 2_200_000     # Rs 22 lakh for imported commercial float


def print_cost_comparison():
    print("PolarSense Cost Comparison & Allowance Analysis")
    print("Disclaimer: Funding allowances, not supplier quotations [TARGET]")
    print("=" * 60)
    print(f"  PolarSense Target per unit : Rs {TARGET_COST_INR / 100_000:.2f} Lakh [TARGET]")
    print(f"  Projected Cost Band        : Rs {PROJECTED_LOW_INR / 100_000:.2f} - {PROJECTED_HIGH_INR / 100_000:.2f} Lakh [TARGET]")
    print(f"  Commercial Imported Float  : Rs {IMPORTED_FLOAT_INR / 100_000:.2f} Lakh")
    print("-" * 60)

    savings_min = IMPORTED_FLOAT_INR - PROJECTED_HIGH_INR
    savings_max = IMPORTED_FLOAT_INR - TARGET_COST_INR
    pct_min = (savings_min / IMPORTED_FLOAT_INR) * 100.0
    pct_max = (savings_max / IMPORTED_FLOAT_INR) * 100.0

    print(f"  Capital Savings (vs Import): Rs {savings_min / 100_000:.2f} to {savings_max / 100_000:.2f} Lakh per float")
    print(f"  Relative Cost Reduction    : {pct_min:.1f}% to {pct_max:.1f}% lower capital expenditure")
    print()


if __name__ == "__main__":
    print_cost_comparison()
