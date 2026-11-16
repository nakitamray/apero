// The food passport: one stamp for every place you've rated something at, and badges for
// filling the pages up. Everything here is worked out from your reviews, nothing extra is stored.
import { CAMPUSES, getPlace } from '../data/campuses';

// one stamp per place, dated the first time you rated there
export function stampsFrom(reviews) {
  const byPlace = {};
  reviews.forEach((r) => {
    const place = getPlace(r.placeId);
    if (!place) return;
    const s = (byPlace[r.placeId] = byPlace[r.placeId] || { place, first: r.createdAt, visits: 0, loved: 0 });
    s.visits += 1;
    if (r.verdict === 'love') s.loved += 1;
    if (r.createdAt && (!s.first || r.createdAt < s.first)) s.first = r.createdAt;
  });
  return byPlace;
}

const count = (list, test) => list.filter(test).length;

// badges, each with how far along you are
export function badgesFrom(reviews, stamps, campus) {
  const stamped = Object.values(stamps);
  const halls = campus.places.filter((p) => p.kind === 'hall');
  const hallsDone = count(halls, (p) => stamps[p.id]);
  const spotsDone = count(stamped, (s) => s.place.kind === 'spot' && !s.place.occasion);
  const datesDone = count(stamped, (s) => s.place.occasion === 'date');
  const campuses = new Set(stamped.map((s) => s.place.campusId)).size;
  const regular = Math.max(0, ...stamped.map((s) => s.visits));
  const meh = count(reviews, (r) => r.verdict === 'meh');
  const loved = count(reviews, (r) => r.verdict === 'love');

  return [
    {
      id: 'first',
      name: 'First stamp',
      about: 'Rate something anywhere',
      have: stamped.length,
      need: 1,
      color: '#E8510C',
    },
    {
      id: 'halls',
      name: 'Hall of fame',
      about: `Every dining hall at ${campus.short}`,
      have: hallsDone,
      need: halls.length,
      color: '#0B7F94',
    },
    { id: 'off', name: 'Off the plan', about: '5 spots off the meal plan', have: spotsDone, need: 5, color: '#FF7B1C' },
    { id: 'date', name: 'Dressed up', about: '3 date night spots', have: datesDone, need: 3, color: '#D9441E' },
    { id: 'regular', name: 'The regular', about: '5 ratings at one place', have: regular, need: 5, color: '#2456B8' },
    { id: 'critic', name: 'Food critic', about: '25 dishes rated', have: reviews.length, need: 25, color: '#13285E' },
    { id: 'romantic', name: 'Easy to please', about: 'Love 10 dishes', have: loved, need: 10, color: '#F2938C' },
    { id: 'tough', name: 'Tough crowd', about: '5 dishes that were not for you', have: meh, need: 5, color: '#55648A' },
    { id: 'abroad', name: 'Study abroad', about: 'Stamps from 2 campuses', have: campuses, need: 2, color: '#B8860B' },
  ].map((b) => ({ ...b, have: Math.min(b.have, b.need), earned: b.need > 0 && b.have >= b.need }));
}

export const campusesIn = (stamps) =>
  CAMPUSES.filter((c) => Object.values(stamps).some((s) => s.place.campusId === c.id));
