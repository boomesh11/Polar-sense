/**
 * regionFromCoords(lat, lon)
 * Derives an oceanographic region label purely from coordinates.
 * No hard-coded per-float labels needed.
 */
export function regionFromCoords(lat, lon) {
  if (lat < -60) return 'Southern Ocean';
  if (lat > 65) {
    if (lon > 60 && lon < 180)  return 'Arctic (Laptev / East Siberian)';
    if (lon > -180 && lon < -100) return 'Arctic (Beaufort Sea)';
    if (lon >= -100 && lon < -60) return 'Arctic (Canadian Basin)';
    return 'Arctic';
  }
  if (lat >= 55 && lat <= 65) {
    if (lon >= -15 && lon <= 30) return 'Norwegian Sea (Coastal)';
    if (lon < -15)              return 'North Atlantic (Subpolar)';
    return 'Nordic Seas';
  }
  if (lat >= 40 && lat < 55) {
    if (lon >= -80 && lon < 0)  return 'North Atlantic';
    return 'North Pacific';
  }
  if (lat >= 0 && lat < 40) {
    return 'Subtropical Gyre';
  }
  if (lat >= -60 && lat < 0) {
    if (lon >= -80 && lon < -20) return 'South Atlantic';
    if (lon >= -20 && lon < 100) return 'Indian Ocean';
    return 'South Pacific';
  }
  return 'Open Ocean';
}
