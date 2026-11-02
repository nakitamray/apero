import { toTen } from './score';
import { bestTrip } from './trip';
import { dealIsOn } from './deals';

// "Where should we eat?" for a group. Starts from everyone's rating of each place, then
// leans toward places someone in the group loves, close ones, and places with a deal today.
export function rankForGroup({ campus, stats, members, modes, budget, deals }) {
  const places = campus.places.filter((p) => p.kind === 'hall' || (p.price || 1) <= budget);

  return places
    .map((place) => {
      const reasons = [];
      let score = stats[place.id]?.score ?? 6;

      members.forEach((m) => {
        const theirs = m.rankings.filter((r) => r.placeId === place.id).sort((a, b) => b.elo - a.elo)[0];
        if (!theirs) return;
        score += (toTen(theirs.elo) - 6) * 0.35;
        if (theirs.verdict === 'love') reasons.push(`${m.you ? 'You' : m.name} loved the ${theirs.dishName}`);
        if (theirs.verdict === 'meh')
          reasons.push(`${m.you ? 'You weren’t' : `${m.name} wasn’t`} into the ${theirs.dishName}`);
      });

      const trip = place.kind === 'spot' ? bestTrip(place, campus, modes) : { mode: 'walk', minutes: 8, cost: 0 };
      if (!trip) return null;
      score -= trip.minutes / 30;

      const deal = deals.find((d) => d.placeId === place.id && dealIsOn(d));
      if (deal) {
        score += 0.6;
        reasons.push(`Deal today: ${deal.title}`);
      }
      if (stats[place.id]?.ratingCount)
        reasons.push(`${stats[place.id].score.toFixed(1)} from ${stats[place.id].ratingCount} ratings`);

      return { place, score, trip, reasons };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}
