// Thin wrapper around the OpenStreetMap Nominatim API — no backend involved,
// per the requirement that this module stays frontend-only.
//
// IMPORTANT (production note, not a blocker for Milestone 2 dev/demo use):
// Nominatim's usage policy (https://operations.osmfoundation.org/policies/nominatim/)
// asks clients to identify themselves and to stay within ~1 request/second.
// Browsers don't let JS set a custom User-Agent, so this is fine for
// development and low-traffic demos, but if this ships to real users at
// scale, proxy these two calls through your FastAPI backend instead (where
// a proper User-Agent header can be set) rather than calling Nominatim
// directly from the browser.

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

/**
 * Searches for a place by free-text query (city, state, country, landmark...).
 * @param {string} query
 * @returns {Promise<Array<{ displayName, latitude, longitude }>>}
 */
export async function searchPlaces(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const url = `${NOMINATIM_BASE_URL}/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(
    query
  )}`;

  const response = await fetch(url, {
    headers: { "Accept-Language": "en" },
  });

  if (!response.ok) {
    throw new Error(`Place search failed (HTTP ${response.status}).`);
  }

  const results = await response.json();

  return results.map((place) => ({
    displayName: place.display_name,
    latitude: parseFloat(place.lat),
    longitude: parseFloat(place.lon),
  }));
}

/**
 * Reverse-geocodes a lat/lng into a structured address.
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{ country, state, district, city, displayName }>}
 */
export async function reverseGeocode(latitude, longitude) {
  const url = `${NOMINATIM_BASE_URL}/reverse?format=json&addressdetails=1&lat=${latitude}&lon=${longitude}`;

  const response = await fetch(url, {
    headers: { "Accept-Language": "en" },
  });

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed (HTTP ${response.status}).`);
  }

  const result = await response.json();
  const address = result.address || {};

  return {
    country: address.country || null,
    state: address.state || address.state_district || null,
    district: address.county || address.district || address.state_district || null,
    city:
      address.city ||
      address.town ||
      address.village ||
      address.hamlet ||
      address.suburb ||
      null,
    displayName: result.display_name || null,
  };
}
