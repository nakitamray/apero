// Personal rankings work like a sorted list: you pick a verdict, then a few
// "this or that" questions slot the dish in between two you've already ranked.
// Each ranking has an elo-ish number that maps onto a 1-10 score.

export const VERDICTS = {
  love: { label: 'Loved it', min: 1100, max: 1300, base: 1200 },
  fine: { label: 'It was fine', min: 950, max: 1100, base: 1025 },
  meh: { label: 'Not for me', min: 700, max: 950, base: 850 },
};

const FLOOR = 700;
const CEIL = 1300;

export const toTen = (elo) => {
  if (elo == null) return null;
  const n = 1 + (9 * (elo - FLOOR)) / (CEIL - FLOOR);
  return Math.round(Math.min(10, Math.max(1, n)) * 10) / 10;
};

export const formatScore = (n) => (n == null ? '–' : n.toFixed(1));

export const MAX_QUESTIONS = 4;

// ranked: same-verdict rankings sorted best first. pos: index the new dish lands at.
export function eloForPosition(ranked, pos, verdict) {
  const band = VERDICTS[verdict];
  if (ranked.length === 0) return band.base;
  const above = ranked[pos - 1]?.elo;
  const below = ranked[pos]?.elo;
  if (above == null) return (below + band.max) / 2;
  if (below == null) return (above + band.min) / 2;
  return (above + below) / 2;
}

// Running totals for a dish or a place. previous = { score, verdict } if this person rated it before,
// so re-rating swaps their old score out instead of counting them twice.
export function applyRating(totals = {}, score, verdict, previous) {
  const next = {
    ratingSum: totals.ratingSum || 0,
    ratingCount: totals.ratingCount || 0,
    love: totals.love || 0,
    fine: totals.fine || 0,
    meh: totals.meh || 0,
  };
  if (previous) {
    next.ratingSum += score - previous.score;
    next[previous.verdict] = Math.max(0, next[previous.verdict] - 1);
  } else {
    next.ratingSum += score;
    next.ratingCount += 1;
  }
  next[verdict] += 1;
  next.score = Math.round((next.ratingSum / next.ratingCount) * 10) / 10;
  return next;
}
