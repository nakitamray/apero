// Google Maps and Yelp info through the website's /api functions (the API keys stay on the server):
// where each place is, and each restaurant's ratings and reviews.
// On the web build it's the same site. A phone build needs EXPO_PUBLIC_SITE_URL (e.g. https://apero.vercel.app).
import { Platform } from 'react-native';

// the web app lives at <site>/app/, so ../api reaches the site's functions from any folder it's hosted under
const base = process.env.EXPO_PUBLIC_SITE_URL || (Platform.OS === 'web' ? '..' : null);

// every place on a campus, found on Google Maps (empty until the site has a Google key)
const located = {};
export function placeLocations(campus, center) {
  if (base == null || !center) return Promise.resolve({});
  if (!located[campus.id]) {
    const names = campus.places.map((p) => p.name).join('|');
    located[campus.id] = fetch(
      `${base}/api/place-locations?near=${encodeURIComponent(campus.city)}&lat=${center[0]}&lng=${center[1]}&names=${encodeURIComponent(names)}`,
    )
      .then((r) => (r.ok ? r.json() : {}))
      .then((byName) => {
        const out = {};
        campus.places.forEach((p) => byName[p.name] && (out[p.id] = byName[p.name]));
        return out;
      })
      .catch(() => ({}));
  }
  return located[campus.id];
}

export async function outsideReviews(place, campus) {
  if (base == null || place.kind !== 'spot') return null;
  const url = `${base}/api/outside-reviews?name=${encodeURIComponent(place.name)}&near=${encodeURIComponent(campus.city)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.google || data.yelp ? data : null;
  } catch {
    return null;
  }
}
