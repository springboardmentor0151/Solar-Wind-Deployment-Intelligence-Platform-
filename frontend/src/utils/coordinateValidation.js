/**
 * Coordinate sanity checks.
 *
 * These catch the OBVIOUS swap case (a latitude outside -90..90, which can
 * only happen if a longitude value ended up in the latitude field) and give
 * a soft, non-blocking heads-up for coordinates far outside the region this
 * project is normally used in.
 *
 * They CANNOT catch the sneaky case — two in-range numbers swapped (e.g.
 * (15.9, 79.7) stored as (79.7, 15.9)) — because both numbers still look
 * individually valid. That case can only be caught by comparing against a
 * known-correct value (e.g. re-deriving from the map or from reverse
 * geocoding), not by math on the numbers alone.
 */

export function isValidLatitude(value) {
  const num = Number(value);
  return Number.isFinite(num) && num >= -90 && num <= 90;
}

export function isValidLongitude(value) {
  const num = Number(value);
  return Number.isFinite(num) && num >= -180 && num <= 180;
}

/**
 * Returns true only when we can PROVE a swap happened — i.e. the stored
 * "latitude" is out of latitude range but WOULD be a valid longitude, and
 * vice versa. This is a definite-swap detector, not a guess.
 */
export function isDefiniteSwap(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  const latOutOfRange = !isValidLatitude(lat);
  const lngWouldBeValidLat = isValidLatitude(lng);

  return latOutOfRange && lngWouldBeValidLat;
}

/**
 * Soft, optional regional plausibility check — flags coordinates far
 * outside India's rough bounding box. This is a HEADS-UP, not a hard rule:
 * remove or widen this if the project needs to support sites outside India.
 */
const INDIA_BOUNDS = { latMin: 6, latMax: 37, lngMin: 68, lngMax: 98 };

export function isOutsideExpectedRegion(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

  return (
    lat < INDIA_BOUNDS.latMin ||
    lat > INDIA_BOUNDS.latMax ||
    lng < INDIA_BOUNDS.lngMin ||
    lng > INDIA_BOUNDS.lngMax
  );
}
