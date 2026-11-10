// Ratings and reviews for a restaurant from Google Maps and Yelp, through the website's
// /api/outside-reviews function (the API keys stay on the server).
// On the web build it's the same site. A phone build needs EXPO_PUBLIC_SITE_URL (e.g. https://apero.vercel.app).
import { Platform } from 'react-native';

// the web app lives at <site>/app/, so ../api reaches the site's functions from any folder it's hosted under
const base = process.env.EXPO_PUBLIC_SITE_URL || (Platform.OS === 'web' ? '..' : null);

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
