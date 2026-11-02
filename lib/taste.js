import { toTen } from './score';

// How alike two people eat, from the dishes you've both ranked.
// Each shared dish compares your two 1-10 scores; a point apart costs 12%.
export function tasteMatch(mine, theirs) {
  const theirsById = Object.fromEntries(theirs.map((r) => [r.dishId, r]));
  const mineById = Object.fromEntries(mine.map((r) => [r.dishId, r]));
  const shared = mine.filter((r) => theirsById[r.dishId]).map((r) => ({ mine: r, theirs: theirsById[r.dishId] }));
  const bothLoved = shared.filter((p) => p.mine.verdict === 'love' && p.theirs.verdict === 'love').map((p) => p.mine);
  const toTry = theirs.filter((r) => r.verdict === 'love' && !mineById[r.dishId]);

  // one dish in common isn't enough to say anything
  if (shared.length < 2) return { percent: null, shared, bothLoved, toTry };
  const gap = shared.reduce((sum, p) => sum + Math.abs(toTen(p.mine.elo) - toTen(p.theirs.elo)), 0) / shared.length;
  return { percent: Math.round(Math.max(0, Math.min(100, 100 - gap * 12))), shared, bothLoved, toTry };
}
