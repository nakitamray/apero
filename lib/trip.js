// How a student gets to a spot and what the trip adds to the bill.
// Distances in data/campuses.js are rough, so everything here is an estimate.

export const MODES = [
  { id: 'walk', label: 'Walk' },
  { id: 'transit', label: 'Bus / train' },
  { id: 'car', label: 'Car' },
];

const MAX_WALK_MILES = 1.5;
const GAS_PER_MILE = 0.16;
const MEAL_COST = { 1: 12, 2: 20, 3: 32 };

export const defaultModes = (campus) => (campus?.transit?.free ? ['walk', 'transit'] : ['walk']);

export function tripOptions(spot, campus) {
  const miles = spot.miles ?? 0.5;
  const transit = campus?.transit;
  const options = [];

  if (miles <= MAX_WALK_MILES) {
    options.push({ mode: 'walk', minutes: Math.round(miles * 20), cost: 0, label: 'walk' });
  }
  if (transit) {
    options.push({
      mode: 'transit',
      minutes: Math.round(8 + miles * 6),
      cost: transit.free ? 0 : transit.fare * 2,
      label: transit.name,
      free: transit.free,
    });
  }
  options.push({
    mode: 'car',
    minutes: Math.round(4 + miles * 3),
    cost: Math.round(miles * 2 * GAS_PER_MILE * 100) / 100,
    label: 'drive',
  });
  return options;
}

// cheapest way there with the modes the student actually has, ties go to the faster one.
// a short walk always wins since it's free and you skip waiting for a bus.
export function bestTrip(spot, campus, modes) {
  const options = tripOptions(spot, campus).filter((o) => modes.includes(o.mode));
  const walk = options.find((o) => o.mode === 'walk');
  if (walk && walk.minutes <= 15) return walk;
  options.sort((a, b) => a.cost - b.cost || a.minutes - b.minutes);
  return options[0] || null;
}

export const money = (n) => (n === 0 ? 'free' : `$${n < 1 ? n.toFixed(2) : n.toFixed(n % 1 ? 2 : 0)}`);

export function describeTrip(trip) {
  if (!trip) return 'too far to walk';
  if (trip.mode === 'walk') return `${trip.minutes} min walk`;
  if (trip.mode === 'transit') {
    return `${trip.label} · ${trip.minutes} min · ${trip.free ? 'free w/ student ID' : `${money(trip.cost)} round trip`}`;
  }
  return `${trip.minutes} min drive · ~${money(trip.cost)} gas`;
}

export const mealCost = (spot) => MEAL_COST[spot.price] || MEAL_COST[1];

// meal + getting there and back
export const totalCost = (spot, trip) => mealCost(spot) + (trip ? trip.cost : 0);
