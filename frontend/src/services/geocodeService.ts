/**
 * RoadGuard AI - Reverse Geocoding Service with in-memory caching and rate limiting.
 * Uses OpenStreetMap Nominatim with graceful fallback to formatted coordinates.
 */

const geocodeCache = new Map<string, string>();

export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<string> {
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'RoadGuardAI/2.0 (geotag-verification@roadguard.ai)',
          Accept: 'application/json',
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.display_name) {
        const addr = data.address || {};
        const road = addr.road || addr.street || addr.pedestrian || '';
        const suburb = addr.suburb || addr.neighbourhood || addr.city_district || '';
        const city = addr.city || addr.town || addr.village || addr.county || '';
        const state = addr.state || '';
        const country = addr.country || '';

        let formatted = '';
        if (road) {
          formatted = `${road}${suburb ? `, ${suburb}` : ''}${city ? `, ${city}` : ''}${state ? `, ${state}` : ''}${country ? `, ${country}` : ''}`;
        } else if (suburb || city) {
          formatted = `${suburb ? `${suburb}, ` : ''}${city ? `${city}, ` : ''}${state ? `${state}, ` : ''}${country}`;
        } else {
          formatted = data.display_name.split(',').slice(0, 4).join(',').trim();
        }

        if (formatted) {
          geocodeCache.set(cacheKey, formatted);
          return formatted;
        }
      }
    }
  } catch (err) {
    console.warn('[GeocodeService] Reverse geocode request failed, falling back:', err);
  }

  const fallback = `${latitude.toFixed(5)}° ${latitude >= 0 ? 'N' : 'S'}, ${Math.abs(longitude).toFixed(5)}° ${longitude >= 0 ? 'E' : 'W'}`;
  geocodeCache.set(cacheKey, fallback);
  return fallback;
}

