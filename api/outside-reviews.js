// GET /api/outside-reviews?name=Mad%20Mushroom%20Pizza&near=West%20Lafayette%2C%20IN
// Looks a restaurant up on Google Maps and Yelp and returns its rating there plus a few reviews.
// Keys live in Vercel's environment variables (GOOGLE_PLACES_API_KEY, YELP_API_KEY), never in the app.
// Either key can be missing; that source is just left out.

const GOOGLE_FIELDS = [
  'places.id',
  'places.displayName',
  'places.rating',
  'places.userRatingCount',
  'places.googleMapsUri',
  'places.reviews',
].join(',');

async function fromGoogle(name, near) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': GOOGLE_FIELDS },
    body: JSON.stringify({ textQuery: `${name}, ${near}`, pageSize: 1 }),
  });
  if (!res.ok) return null;
  const place = (await res.json()).places?.[0];
  if (!place?.rating) return null;
  return {
    rating: place.rating,
    count: place.userRatingCount || 0,
    url: place.googleMapsUri,
    reviews: (place.reviews || [])
      .filter((r) => r.text?.text)
      .slice(0, 3)
      .map((r) => ({
        author: r.authorAttribution?.displayName || 'Google user',
        authorUrl: r.authorAttribution?.uri,
        rating: r.rating,
        text: r.text.text,
        when: r.relativePublishTimeDescription,
      })),
  };
}

async function fromYelp(name, near) {
  const key = process.env.YELP_API_KEY;
  if (!key) return null;
  const headers = { Authorization: `Bearer ${key}`, Accept: 'application/json' };
  const search = await fetch(
    `https://api.yelp.com/v3/businesses/search?limit=1&term=${encodeURIComponent(name)}&location=${encodeURIComponent(near)}`,
    { headers },
  );
  if (!search.ok) return null;
  const biz = (await search.json()).businesses?.[0];
  if (!biz) return null;
  // review excerpts are only on some Yelp plans; without them we still show the rating
  let reviews = [];
  const more = await fetch(`https://api.yelp.com/v3/businesses/${biz.id}/reviews?limit=3&sort_by=yelp_sort`, {
    headers,
  });
  if (more.ok) {
    reviews = ((await more.json()).reviews || []).map((r) => ({
      author: r.user?.name || 'Yelp user',
      rating: r.rating,
      text: r.text,
      url: r.url,
    }));
  }
  return { rating: biz.rating, count: biz.review_count || 0, url: biz.url, reviews };
}

module.exports = async (req, res) => {
  const name = String(req.query.name || '').slice(0, 120);
  const near = String(req.query.near || '').slice(0, 120);
  if (!name || !near) {
    res.status(400).json({ error: 'name and near are required' });
    return;
  }
  const [google, yelp] = await Promise.all([
    fromGoogle(name, near).catch(() => null),
    fromYelp(name, near).catch(() => null),
  ]);
  // ratings barely move day to day, so let Vercel's cache answer repeat visits (keeps API costs down)
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  res.status(200).json({ google, yelp });
};
