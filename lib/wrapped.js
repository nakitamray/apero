import { getPlace } from '../data/campuses';
import { reasonLabel } from './tags';
import { longestStreak } from './time';
import { tasteMatch } from './taste';

export function semesterOf(date = new Date()) {
  const m = date.getMonth();
  const y = date.getFullYear();
  if (m >= 7) return { name: `Fall ${y}`, start: new Date(y, 7, 1) };
  if (m <= 4) return { name: `Spring ${y}`, start: new Date(y, 0, 1) };
  return { name: `Summer ${y}`, start: new Date(y, 5, 1) };
}

const PERSONAS = {
  optimist: ['The Optimist', 'You find something to love almost everywhere you eat.'],
  critic: ['The Critic', 'High standards. When you love something, it means something.'],
  explorer: ['The Explorer', 'New spot every week. Your map is covered in pins.'],
  regular: ['The Regular', 'You know what you like and they know your order.'],
  balanced: ['The Balanced Eater', 'A little of everything, judged fairly.'],
};

// Everything the Wrapped cards need, from your reviews this semester
export function buildWrapped({ reviews, rankings, friends }) {
  const semester = semesterOf();
  const mine = reviews.filter((r) => r.createdAt && r.createdAt >= semester.start);
  const total = mine.length;

  const byPlace = {};
  const byReason = {};
  const verdicts = { love: 0, fine: 0, meh: 0 };
  mine.forEach((r) => {
    byPlace[r.placeId] = (byPlace[r.placeId] || 0) + 1;
    r.tags?.forEach((t) => (byReason[t] = (byReason[t] || 0) + 1));
    verdicts[r.verdict] += 1;
  });
  const [topPlaceId, topPlaceCount = 0] = Object.entries(byPlace).sort((a, b) => b[1] - a[1])[0] || [];
  const [topReason] = Object.entries(byReason).sort((a, b) => b[1] - a[1])[0] || [];
  const reviewed = new Set(mine.map((r) => r.dishId));
  const topDish = rankings.filter((r) => reviewed.has(r.dishId)).sort((a, b) => b.elo - a.elo)[0] || null;

  let persona = 'balanced';
  if (total && verdicts.love / total >= 0.7) persona = 'optimist';
  else if (total && verdicts.meh / total >= 0.35) persona = 'critic';
  else if (Object.keys(byPlace).length >= 6) persona = 'explorer';
  else if (total >= 3 && topPlaceCount / total >= 0.5) persona = 'regular';

  const twin = friends
    .map((f) => ({ friend: f, match: tasteMatch(rankings, f.rankings).percent }))
    .filter((t) => t.match != null)
    .sort((a, b) => b.match - a.match)[0];

  return {
    semester: semester.name,
    total,
    places: Object.keys(byPlace).length,
    topDish,
    topPlace: topPlaceId ? { place: getPlace(topPlaceId), count: topPlaceCount } : null,
    topReason: topReason ? reasonLabel(topReason) : null,
    persona: PERSONAS[persona],
    twin: twin || null,
    streak: longestStreak(mine.map((r) => r.createdAt)),
    verdicts,
  };
}
