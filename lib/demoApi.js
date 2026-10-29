// In-memory stand-in for firebaseApi.js so the demo works with no account and no network.
// Same function names and return shapes. Everything resets when the app reloads.
import { getPlace } from '../data/campuses';
import { applyRating, toTen } from './score';
import { dishIdFor } from './ids';
import { startOfToday, todayKey } from './time';

export const DEMO_UID = 'demo';

const ago = (minutes) => new Date(Date.now() - minutes * 60000);
const today = todayKey();
const ALL_DAY = [{ name: 'Lunch' }, { name: 'Dinner' }];

// placeId, name, tags, extras (station + meals for halls with a menu today)
const MENU = [
  ['purdue-ford', 'Chicken Tikka Masala', ['spicy', 'protein'], { station: 'Global', mealsServed: ALL_DAY }],
  ['purdue-ford', 'Mac & Cheese', ['cozy'], { station: 'Comfort', mealsServed: [{ name: 'Dinner' }] }],
  ['purdue-ford', 'Roasted Veggie Bowl', ['healthy'], { station: 'Garden', mealsServed: [{ name: 'Lunch' }] }],
  [
    'purdue-ford',
    'Buttermilk Pancakes',
    ['sweet', 'cozy'],
    { station: 'Griddle', mealsServed: [{ name: 'Breakfast' }] },
  ],
  ['purdue-wiley', 'Popcorn Chicken', ['protein', 'value'], { station: 'Grill', mealsServed: [{ name: 'Dinner' }] }],
  ['purdue-wiley', 'Tomato Basil Soup', ['cozy', 'sick'], { station: 'Soup', mealsServed: ALL_DAY }],
  ['purdue-earhart', 'Belgian Waffle Bar', ['sweet'], { station: 'Breakfast', mealsServed: [{ name: 'Breakfast' }] }],
  ['purdue-earhart', 'Spicy Ramen Bowl', ['spicy', 'cozy'], { station: 'Noodles', mealsServed: ALL_DAY }],
  ['purdue-windsor', 'Street Tacos', ['spicy', 'value'], { station: 'Fiesta', mealsServed: [{ name: 'Lunch' }] }],
  ['purdue-hillenbrand', 'Vegan Buddha Bowl', ['healthy'], { station: 'Fresh', mealsServed: [{ name: 'Lunch' }] }],
  ['purdue-triple-xxx', 'Duane Purvis All-American Burger', ['value', 'protein'], {}],
  ['purdue-triple-xxx', 'Root Beer Float', ['sweet'], {}],
  ['purdue-mad-mushroom', 'Garlic Cheese Bread', ['cozy', 'value'], {}],
  ['purdue-greyhouse', 'Honey Lavender Latte', ['sweet'], {}],
  ['ucla-diddy-riese', 'Ice Cream Sandwich', ['sweet', 'value'], {}],
  ['ucla-bplate', 'Grilled Salmon Plate', ['healthy', 'protein'], {}],
  ['ucla-in-n-out', 'Double-Double Animal Style', ['value'], {}],
  ['berkeley-cheese-board', 'Daily Veggie Pizza', ['value'], {}],
  ['nyu-joes-pizza', 'Plain Slice', ['value'], {}],
  ['nyu-mamouns', 'Falafel Sandwich', ['value', 'healthy'], {}],
  ['uw-thai-tom', 'Swimming Rama', ['spicy'], {}],
  ['mit-flour', 'Sticky Bun', ['sweet'], {}],
  ['cmu-lulus', 'Pad See Ew', ['cozy'], {}],
];

// placeId, dish, who, verdict, score, note, reasons, minutes ago
const REVIEWS = [
  [
    'purdue-wiley',
    'Popcorn Chicken',
    'maya',
    'love',
    9.1,
    'get there before 6 or it’s gone',
    ['flavor', 'portion'],
    12,
  ],
  [
    'purdue-triple-xxx',
    'Duane Purvis All-American Burger',
    'jordan',
    'love',
    8.6,
    'peanut butter on a burger. trust it',
    ['value', 'flavor'],
    90,
  ],
  ['purdue-ford', 'Mac & Cheese', 'sam', 'fine', 6.4, 'solid on a cold day', ['portion'], 300],
  ['purdue-ford', 'Chicken Tikka Masala', 'priya', 'love', 9.3, 'best thing in any dining court', ['flavor'], 45],
  ['purdue-ford', 'Chicken Tikka Masala', 'leo', 'love', 8.7, '', ['flavor', 'portion'], 600],
  [
    'purdue-earhart',
    'Spicy Ramen Bowl',
    'ana',
    'fine',
    7.0,
    'needs more broth but the chili oil is great',
    ['flavor'],
    150,
  ],
  [
    'purdue-earhart',
    'Belgian Waffle Bar',
    'chris',
    'love',
    8.2,
    'strawberries + whipped cream, every time',
    ['fresh'],
    1400,
  ],
  ['purdue-windsor', 'Street Tacos', 'noor', 'fine', 6.8, '', ['quick'], 220],
  ['purdue-mad-mushroom', 'Garlic Cheese Bread', 'maya', 'love', 8.4, 'late night essential', ['value'], 2000],
  ['purdue-greyhouse', 'Honey Lavender Latte', 'ana', 'love', 8.0, 'good study spot too', ['vibe'], 80],
  ['purdue-hillenbrand', 'Vegan Buddha Bowl', 'sam', 'meh', 4.2, 'kind of dry today', [], 400],
  ['purdue-wiley', 'Tomato Basil Soup', 'leo', 'fine', 6.1, 'sick day mvp', ['quick'], 700],
  ['ucla-diddy-riese', 'Ice Cream Sandwich', 'kai', 'love', 9.4, 'cheapest dessert in LA', ['value'], 30],
  ['ucla-bplate', 'Grilled Salmon Plate', 'mina', 'love', 8.1, '', ['fresh'], 200],
  ['ucla-in-n-out', 'Double-Double Animal Style', 'jo', 'love', 8.8, '', ['value'], 500],
  ['berkeley-cheese-board', 'Daily Veggie Pizza', 'ella', 'love', 9.0, 'the line is worth it', ['flavor'], 60],
  ['nyu-joes-pizza', 'Plain Slice', 'marco', 'love', 8.9, '', ['value', 'quick'], 100],
  ['nyu-mamouns', 'Falafel Sandwich', 'dev', 'love', 8.5, 'under $6 in the village??', ['value'], 300],
  [
    'uw-thai-tom',
    'Swimming Rama',
    'rae',
    'love',
    8.7,
    'sit at the counter and watch the woks',
    ['flavor', 'vibe'],
    240,
  ],
  ['mit-flour', 'Sticky Bun', 'sol', 'love', 9.2, '', ['flavor'], 900],
  ['cmu-lulus', 'Pad See Ew', 'ben', 'fine', 7.2, '', ['portion'], 1600],
];

// your own list in the demo, so My list and the this-or-that flow have something to compare against
const MY_RANKINGS = [
  ['purdue-ford', 'Chicken Tikka Masala', 'love', 1240, 'extra rice, always', ['flavor'], 200],
  ['purdue-wiley', 'Popcorn Chicken', 'love', 1185, '', ['portion'], 1500],
  ['purdue-triple-xxx', 'Duane Purvis All-American Burger', 'love', 1140, 'worth the walk', ['value', 'flavor'], 3000],
  ['purdue-ford', 'Mac & Cheese', 'fine', 1010, '', ['quick'], 4400],
];

const store = { dishes: {}, places: {}, reviews: [], rankings: {}, profile: { name: 'Guest', campusId: 'purdue' } };

function seed() {
  MENU.forEach(([placeId, name, tags, extra]) => {
    const place = getPlace(placeId);
    const id = dishIdFor(placeId, name);
    store.dishes[id] = {
      id,
      name,
      campusId: place.campusId,
      placeId,
      placeName: place.name,
      tags,
      score: null,
      ratingCount: 0,
      ...extra,
      ...(extra.mealsServed ? { lastServedDate: today } : {}),
    };
  });
  REVIEWS.forEach(([placeId, dishName, who, verdict, score, note, tags, minutes], i) => {
    const dish = store.dishes[dishIdFor(placeId, dishName)];
    addReview({
      id: `seed-${i}`,
      userId: who,
      userName: who,
      dish,
      verdict,
      score,
      note,
      tags,
      createdAt: ago(minutes),
    });
    // a few likes from made-up classmates so the hearts aren't all zero
    store.reviews[0].likedBy = ['a', 'b', 'c', 'd', 'e'].slice(0, (i * 7) % 6);
  });
  MY_RANKINGS.forEach(([placeId, dishName, verdict, elo, note, tags, minutes]) => {
    const dish = store.dishes[dishIdFor(placeId, dishName)];
    addReview({
      id: `mine-${dish.id}`,
      userId: DEMO_UID,
      userName: 'you',
      dish,
      verdict,
      score: toTen(elo),
      note,
      tags,
      createdAt: ago(minutes),
    });
    store.rankings[dish.id] = {
      dishId: dish.id,
      dishName,
      placeId,
      placeName: dish.placeName,
      campusId: dish.campusId,
      verdict,
      elo,
    };
  });
}

function addReview({ id, userId, userName, dish, verdict, score, note, tags, createdAt, previous }) {
  Object.assign(store.dishes[dish.id], applyRating(store.dishes[dish.id], score, verdict, previous));
  const place = getPlace(dish.placeId);
  store.places[dish.placeId] = {
    id: dish.placeId,
    campusId: place.campusId,
    name: place.name,
    ...applyRating(store.places[dish.placeId], score, verdict, previous),
  };
  store.reviews.unshift({
    id,
    userId,
    userName,
    campusId: dish.campusId,
    placeId: dish.placeId,
    placeName: dish.placeName,
    dishId: dish.id,
    dishName: dish.name,
    verdict,
    score,
    note,
    tags,
    likedBy: [],
    createdAt,
  });
}

seed();

const wait = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 120));
const copy = (x) => JSON.parse(JSON.stringify(x));
const byScore = (a, b) => (b.score ?? -1) - (a.score ?? -1);
const newestFirst = (rows) => [...rows].sort((a, b) => b.createdAt - a.createdAt);

export const getProfile = async () => wait({ ...store.profile });
export const saveProfile = async (uid, data) => {
  Object.assign(store.profile, data);
};

export const getDish = async (id) => wait(store.dishes[id] ? { ...store.dishes[id] } : null);
export const campusDishes = async (campusId) =>
  wait(Object.values(store.dishes).filter((d) => d.campusId === campusId));
export const placeDishes = async (placeId) => wait(Object.values(store.dishes).filter((d) => d.placeId === placeId));

export const topDishes = async (campusId, count = 8) =>
  wait(
    Object.values(store.dishes)
      .filter((d) => d.campusId === campusId && d.ratingCount > 0)
      .sort(byScore)
      .slice(0, count),
  );

export const moodDishes = async (campusId, tag) =>
  wait(
    Object.values(store.dishes)
      .filter((d) => d.campusId === campusId && d.tags?.includes(tag))
      .sort(byScore),
  );

export async function addDish({ place, name, tags }) {
  const id = dishIdFor(place.id, name);
  if (!store.dishes[id]) {
    store.dishes[id] = {
      id,
      name: name.trim(),
      campusId: place.campusId,
      placeId: place.id,
      placeName: place.name,
      tags,
      score: null,
      ratingCount: 0,
    };
  }
  return { ...store.dishes[id] };
}

export const myRankings = async () => wait(Object.values(store.rankings).sort((a, b) => b.elo - a.elo));
export const myRanking = async (uid, dishId) => wait(store.rankings[dishId] || null);

export async function saveReview({ userName, dish, verdict, elo, tags, note }) {
  const old = store.rankings[dish.id];
  const score = toTen(elo);
  addReview({
    id: `demo-${Date.now()}`,
    userId: DEMO_UID,
    userName,
    dish,
    verdict,
    score,
    note: note.trim(),
    tags,
    createdAt: new Date(),
    previous: old ? { score: toTen(old.elo), verdict: old.verdict } : null,
  });
  store.rankings[dish.id] = {
    dishId: dish.id,
    dishName: dish.name,
    placeId: dish.placeId,
    placeName: dish.placeName,
    campusId: dish.campusId,
    verdict,
    elo,
  };
  return wait();
}

export const campusFeed = async (campusId, count = 30) =>
  wait(copyDates(newestFirst(store.reviews.filter((r) => r.campusId === campusId)).slice(0, count)));
export const dishReviews = async (dishId, count = 5) =>
  wait(copyDates(newestFirst(store.reviews.filter((r) => r.dishId === dishId)).slice(0, count)));
export const placeReviews = async (placeId, count = 8) =>
  wait(copyDates(newestFirst(store.reviews.filter((r) => r.placeId === placeId)).slice(0, count)));
export const userReviews = async () => wait(copyDates(newestFirst(store.reviews.filter((r) => r.userId === DEMO_UID))));

export const campusPlaceStats = async (campusId) =>
  wait(
    Object.fromEntries(
      Object.values(store.places)
        .filter((p) => p.campusId === campusId)
        .map((p) => [p.id, { ...p }]),
    ),
  );
export const getPlaceStats = async (placeId) => wait(store.places[placeId] ? { ...store.places[placeId] } : null);
export const topPlacesWorld = async (count = 15) =>
  wait(
    Object.values(store.places)
      .sort(byScore)
      .slice(0, count)
      .map((p) => ({ ...p })),
  );

export async function activityToday(campusId) {
  const since = startOfToday();
  const counts = {};
  store.reviews
    .filter((r) => r.campusId === campusId && r.createdAt >= since)
    .forEach((r) => (counts[r.placeId] = (counts[r.placeId] || 0) + 1));
  return wait(counts);
}

export async function setLiked(reviewId, uid, liked) {
  const review = store.reviews.find((r) => r.id === reviewId);
  if (!review) return;
  const others = review.likedBy.filter((id) => id !== uid);
  review.likedBy = liked ? [...others, uid] : others;
}

// screens may hold on to rows, so hand out copies (and keep dates as Dates)
function copyDates(rows) {
  return rows.map((r) => ({ ...copy(r), createdAt: r.createdAt }));
}
