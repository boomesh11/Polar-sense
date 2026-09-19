/**
 * regionFromCoords(lat, lon)
 * Derives an oceanographic region label purely from coordinates.
 * No hard-coded per-float labels needed.
 */
export function regionFromCoords(lat, lon) {
  if (lat < -50) return 'Southern Ocean';
  if (lat > 66) return 'Arctic';
  if (lat >= 55 && lat <= 66) return 'Coastal trials';
  if (lat < 0) return 'Southern Ocean';
  return 'Arctic';
}

export function detailRegionFromCoords(lat, lon) {
  if (lat < -60) {
    if (lon > 150 || lon < -150) return 'Ross Sea (Antarctica)';
    if (lon > 50 && lon < 90) return 'Prydz Bay Sector (MoES/NCPOR)';
    if (lon >= -70 && lon <= -50) return 'Weddell Sea';
    return 'Southern Ocean Polar Front';
  }
  if (lat < -50) return 'Southern Ocean (Subantarctic)';
  if (lat > 75) return 'Arctic (Fram Strait / High Pack)';
  if (lat > 66) {
    if (lon > -160 && lon < -120) return 'Arctic (Beaufort Gyre)';
    return 'Arctic Basin';
  }
  if (lat >= 55 && lat <= 66) return 'Norwegian Coast (Trial Trench)';
  return 'Open Ocean Test Zone';
}
