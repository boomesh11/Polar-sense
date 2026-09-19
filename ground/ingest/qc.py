"""
qc.py — Real-time Quality Control (RTQC) following Argo Standards (Flags 1-4).
Team AQUA LEAGUE · SIH 2026 · PS 26065

Argo Flag Conventions:
  1 = Good
  2 = Probably good
  3 = Probably bad
  4 = Bad data
"""
from dataclasses import dataclass
from typing import List

# Range thresholds (Argo RTQC Manual)
TEMP_GLOBAL_MIN = -2.5
TEMP_GLOBAL_MAX = 40.0

PSAL_GLOBAL_MIN = 2.0
PSAL_GLOBAL_MAX = 41.0

PRES_GLOBAL_MIN = -5.0
PRES_GLOBAL_MAX = 1000.0

@dataclass
class QCLevelResult:
    depth_dbar: float
    temp_c: float
    psal_psu: float
    temp_qc: int
    psal_qc: int
    overall_qc: int

def apply_argo_qc(depths: List[float], temps: List[float], psals: List[float]) -> List[QCLevelResult]:
    """Applies Argo RTQC range tests and spike tests to profile levels."""
    n = len(depths)
    t_flags = []
    s_flags = []

    # 1. Global Range Test
    for i in range(n):
        t = temps[i]
        s = psals[i]
        p = depths[i]

        t_flag = 1 if (TEMP_GLOBAL_MIN <= t <= TEMP_GLOBAL_MAX and PRES_GLOBAL_MIN <= p <= PRES_GLOBAL_MAX) else 4
        s_flag = 1 if (PSAL_GLOBAL_MIN <= s <= PSAL_GLOBAL_MAX and PRES_GLOBAL_MIN <= p <= PRES_GLOBAL_MAX) else 4

        t_flags.append(t_flag)
        s_flags.append(s_flag)

    # 2. Spike Test (for profiles with >= 3 levels)
    for i in range(1, n - 1):
        if t_flags[i] == 1:
            test_val = abs(temps[i] - (temps[i - 1] + temps[i + 1]) / 2.0) - abs((temps[i + 1] - temps[i - 1]) / 2.0)
            if test_val > 6.0:  # Spike threshold
                t_flags[i] = 4
            elif test_val > 2.0:
                t_flags[i] = 3

        if s_flags[i] == 1:
            test_val = abs(psals[i] - (psals[i - 1] + psals[i + 1]) / 2.0) - abs((psals[i + 1] - psals[i - 1]) / 2.0)
            if test_val > 0.9:
                s_flags[i] = 4
            elif test_val > 0.3:
                s_flags[i] = 3

    results = []
    for i in range(n):
        comp = max(t_flags[i], s_flags[i])
        results.append(QCLevelResult(
            depth_dbar=depths[i],
            temp_c=temps[i],
            psal_psu=psals[i],
            temp_qc=t_flags[i],
            psal_qc=s_flags[i],
            overall_qc=comp
        ))

    return results
