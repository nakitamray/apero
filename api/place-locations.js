// GET /api/place-locations?near=West%20Lafayette%2C%20IN&lat=40.42&lng=-86.92&names=Earhart%20Dining%20Court|Mad%20Mushroom%20Pizza
// Finds each named place on Google Maps near a campus and returns { name: [lat, lng] }.
// Uses GOOGLE_PLACES_API_KEY from Vercel's environment variables. Restaurants don't move, so the
// answer is cached for a week (one Google lookup per place per week, well inside the free allowance).

async function locate(key, name, near, lat, lng) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.location',
    },
    body: JSON.stringify({
      textQuery: near ? `${name}, ${near}` : name,
      pageSize: 1,
      locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 15000 } },
    }),
  });
  if (!res.ok) return null;
  const loc = (await res.json()).places?.[0]?.location;
  return loc ? [loc.latitude, loc.longitude] : null;
}

module.exports = async (req, res) => {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const near = String(req.query.near || '').slice(0, 80);
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const names = String(req.query.names || '')
    .split('|')
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, 40);
  if (!key) {
    res.status(200).json({});
    return;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !names.length) {
    res.status(400).json({ error: 'lat, lng and names are required' });
    return;
  }
  const found = await Promise.all(names.map((n) => locate(key, n, near, lat, lng).catch(() => null)));
  const out = {};
  names.forEach((n, i) => {
    if (found[i]) out[n] = found[i];
  });
  res.setHeader('Cache-Control', 'public, s-maxage=604800, stale-while-revalidate=2592000');
  res.status(200).json(out);
};
