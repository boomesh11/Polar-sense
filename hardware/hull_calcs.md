# PolarSense Hull Stress & Elastic Buckling Calculations

Analytical structural assessment of the 6061-T6 aluminium cylindrical pressure housing for 500 m rated depth.

**TRL 4 Status: Analytical closed-form calculations only. No physical pressure chamber qualification or destructive burst testing has been performed.**

---

## 1. Design Inputs & Material Specifications

| Parameter | Symbol | Value | Units | Status Tag |
|---|---|---|---|---|
| Outer Diameter | $D_o$ | 160 | mm | `TARGET` |
| Length | $L$ | 1300 | mm | `TARGET` |
| Wall Thickness | $t$ | 8.0 | mm | `TARGET` |
| Inner Diameter | $D_i$ | 144 | mm | `CALCULATED` |
| Rated Depth | $h$ | 500 | m | `TARGET` |
| Operating Park Depth | $h_{park}$ | 450 | m | `TARGET` |
| Seawater Density | $\rho$ | 1027 | kg/m³ | `CALCULATED` |
| Hull Material | — | 6061-T6 Aluminium | — | `TARGET` |
| Yield Strength | $\sigma_y$ | 276 | MPa | `TARGET` |
| Young's Modulus | $E$ | 68.9 | GPa | `TARGET` |
| Poisson's Ratio | $\nu$ | 0.33 | — | `TARGET` |

---

## 2. External Hydrostatic Pressure

At 500 m rated depth:
$$P_{ext} = \rho \cdot g \cdot h = 1027 \text{ kg/m}^3 \times 9.80665 \text{ m/s}^2 \times 500 \text{ m} = 5.0357 \text{ MPa} \approx 5.04 \text{ MPa} \quad [\text{CALCULATED}]$$

At 450 m operating park depth:
$$P_{park} = 1027 \times 9.80665 \times 450 = 4.532 \text{ MPa} \approx 4.53 \text{ MPa} \quad [\text{CALCULATED}]$$

---

## 3. Circumferential (Hoop) Stress

Using thick-walled cylinder theory (Lamé equation for maximum hoop stress at the inner boundary $r_i$):
$$\sigma_{\theta, max} = P_{ext} \frac{2 r_o^2}{r_o^2 - r_i^2}$$

Where:
- $r_o = 80 \text{ mm}$
- $r_i = 72 \text{ mm}$
- $r_o^2 = 6400 \text{ mm}^2$
- $r_i^2 = 5184 \text{ mm}^2$
- $r_o^2 - r_i^2 = 1216 \text{ mm}^2$

$$\sigma_{\theta, max} = 5.04 \times \frac{2 \times 6400}{1216} = 5.04 \times 10.526 = 53.05 \text{ MPa} \quad [\text{CALCULATED}]$$

### Yield Safety Factor:
$$SF_{yield} = \frac{\sigma_y}{\sigma_{\theta, max}} = \frac{276 \text{ MPa}}{53.05 \text{ MPa}} = 5.20 \quad [\text{CALCULATED}]$$
The hull operates well within elastic limits under maximum rated hydrostatic pressure.

---

## 4. Elastic Buckling (Instability) Pressure

For an un-stiffened circular tube subject to external pressure, the von Mises critical buckling pressure is given by:
$$P_{cr} = \frac{2 E}{1 - \nu^2} \left( \frac{t}{D_o} \right)^3$$

Substituting material parameters:
- $E = 68,900 \text{ MPa}$
- $1 - \nu^2 = 1 - (0.33)^2 = 0.8911$
- $\frac{t}{D_o} = \frac{8.0}{160} = 0.05$
- $\left( \frac{t}{D_o} \right)^3 = (0.05)^3 = 0.000125$

$$P_{cr} = \frac{2 \times 68900}{0.8911} \times 0.000125 = 154640 \times 0.000125 = 19.33 \text{ MPa} \quad [\text{CALCULATED}]$$

### Buckling Safety Factor:
$$SF_{buckling} = \frac{P_{cr}}{P_{ext}} = \frac{19.33 \text{ MPa}}{5.04 \text{ MPa}} = 3.84 \approx 3.8\times \quad [\text{CALCULATED}]$$

The critical elastic collapse pressure provides a ~3.8× safety factor against hydrostatic buckling at the 500 m rated depth.
