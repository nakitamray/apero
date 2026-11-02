// In-memory stand-in for firebaseApi.js so the demo works with no account and no network.
// Same function names and return shapes. Every campus gets a few made-up classmates, menus
// and deals so whichever school you pick feels lived in. Resets when the app reloads.
import { CAMPUSES, getCampus, getPlace } from '../data/campuses';
import { applyRating, toTen } from './score';
import { dishIdFor } from './ids';
import { startOfToday, todayKey } from './time';
import { REASONS } from './tags';

export const DEMO_UID = 'demo';

const today = todayKey();
const ago = (minutes) => new Date(Date.now() - minutes * 60000);
const eloFor = (score) => 700 + ((score - 1) * 600) / 9;
const verdictFor = (score) => (score >= 7.8 ? 'love' : score >= 5.8 ? 'fine' : 'meh');

// small seeded random so the demo looks the same every time
function rng(seedText) {
  let a = [...seedText].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rand, list) => list[Math.floor(rand() * list.length)];

// --- menus ---------------------------------------------------------------

const BY_CUISINE = [
  [/pizza/i, ['Margherita Slice', 'Pepperoni Slice', 'Garlic Knots']],
  [/taco|mexican/i, ['Carne Asada Tacos', 'Al Pastor Tacos', 'Chips & Guac']],
  [/burger/i, ['Classic Cheeseburger', 'Fries', 'Chocolate Shake']],
  [/thai/i, ['Pad Thai', 'Green Curry', 'Thai Iced Tea']],
  [/chinese/i, ['Pork Dumplings', 'Scallion Pancake', 'Dan Dan Noodles']],
  [/coffee|cafe/i, ['Iced Latte', 'Almond Croissant', 'Breakfast Sandwich']],
  [/bakery|pastr/i, ['Morning Bun', 'Chocolate Chip Cookie', 'Lemon Tart']],
  [/sandwich/i, ['Italian Sub', 'Turkey Club', 'Pickle Spear']],
  [/diner/i, ['Pancake Stack', 'Patty Melt', 'Hash Browns']],
  [/pub/i, ['Fish & Chips', 'Wings', 'Loaded Fries']],
  [/mediterranean|falafel|israeli/i, ['Falafel Wrap', 'Chicken Shawarma Plate', 'Hummus Bowl']],
  [/indian/i, ['Chicken Tikka Masala', 'Garlic Naan', 'Samosas']],
  [/korean/i, ['Bibimbap', 'Spicy Pork Bowl', 'Kimchi Fried Rice']],
  [/sushi/i, ['Spicy Tuna Roll', 'Salmon Nigiri', 'Miso Soup']],
  [/noodle|ramen/i, ['Tonkotsu Ramen', 'Pad See Ew', 'Cold Sesame Noodles']],
  [/seafood/i, ['Fried Shrimp Basket', 'Fish Tacos', 'Clam Chowder']],
  [/vegetarian|plant|bowl/i, ['Grain Bowl', 'Chickpea Sandwich', 'Sweet Potato Fries']],
  [/hot dog/i, ['Chili Dog', 'Bratwurst', 'Lemonade']],
  [/cookie|ice cream|donut/i, ['Ice Cream Sandwich', 'Glazed Donut', 'Cookie Box']],
  [/breakfast/i, ['Bacon Egg & Cheese', 'Breakfast Burrito', 'Hash Brown Stack']],
  [/ukrainian/i, ['Pierogi', 'Borscht', 'Potato Pancakes']],
  [/arepa/i, ['Iced Latte', 'Cheese Arepa', 'Chocolate Croissant']],
];

const HALL_MENU = [
  ['Buttermilk Pancakes', 'Breakfast', 'Griddle'],
  ['Breakfast Burrito', 'Breakfast', 'Griddle'],
  ['Stir Fry Bowl', 'Lunch', 'Wok'],
  ['Build-Your-Own Pasta', 'Dinner', 'Italian'],
  ['Grilled Chicken Plate', 'Lunch', 'Grill'],
  ['Tomato Basil Soup', 'Lunch', 'Soup'],
  ['Chocolate Chip Cookies', 'Dinner', 'Bakery'],
  ['Chicken Tikka Masala', 'Dinner', 'Global'],
  ['Mac & Cheese', 'Dinner', 'Comfort'],
  ['Roasted Veggie Bowl', 'Lunch', 'Fresh'],
  ['Street Tacos', 'Lunch', 'Fiesta'],
  ['Spicy Ramen Bowl', 'Dinner', 'Noodles'],
];

const TAG_WORDS = {
  cozy: /soup|mac|pasta|ramen|chowder|pierogi|pancake|grilled cheese/i,
  healthy: /bowl|salad|veggie|grilled|salmon|hummus|falafel/i,
  spicy: /spicy|curry|tikka|kimchi|dan dan|buffalo|al pastor/i,
  sweet: /cookie|donut|bun|tart|shake|croissant|ice cream|latte|tea|pancake/i,
  protein: /chicken|beef|pork|steak|tuna|salmon|shrimp|egg|asada/i,
  value: /slice|taco|burger|burrito|dog|fries|dumpling|sub|naan/i,
  sick: /soup|broth|chowder|tea/i,
};
const tagsFor = (name) => Object.keys(TAG_WORDS).filter((t) => TAG_WORDS[t].test(name));

// a couple of hand-written ones so Purdue reads especially real
const HANDMADE = {
  'purdue-triple-xxx': ['Duane Purvis All-American Burger', 'Root Beer Float', 'Hash Browns'],
  'purdue-mad-mushroom': ['Garlic Cheese Bread', 'Pepperoni Slice'],
  'purdue-greyhouse': ['Honey Lavender Latte', 'Almond Croissant'],
  'purdue-wiley': ['Popcorn Chicken', 'Tomato Basil Soup', 'Buttermilk Pancakes'],
  'ucla-diddy-riese': ['Ice Cream Sandwich', 'Cookie Box'],
  'ucla-in-n-out': ['Double-Double Animal Style', 'Fries', 'Chocolate Shake'],
  'berkeley-cheese-board': ['Daily Veggie Pizza'],
  'nyu-joes-pizza': ['Plain Slice', 'Fresh Mozzarella Slice'],
  'uw-thai-tom': ['Swimming Rama', 'Pad Thai'],
  'mit-flour': ['Sticky Bun', 'Lemon Tart'],
};

function menuFor(place, rand) {
  if (place.kind === 'hall') {
    const picks = [...HALL_MENU].sort(() => rand() - 0.5).slice(0, 5);
    const names = HANDMADE[place.id] || [];
    const extra = names.map((n) => [n, n.includes('Pancake') ? 'Breakfast' : 'Dinner', 'Grill']);
    return [...extra, ...picks.filter(([n]) => !names.includes(n))].map(([name, meal, station]) => ({
      name,
      station,
      mealsServed: meal === 'Breakfast' ? [{ name: 'Breakfast' }] : [{ name: 'Lunch' }, { name: 'Dinner' }],
      lastServedDate: today,
    }));
  }
  const names = HANDMADE[place.id] || (BY_CUISINE.find(([re]) => re.test(place.cuisine))?.[1] ?? ['House Special']);
  return names.map((name) => ({ name }));
}

// --- people --------------------------------------------------------------

const NAMES = {
  purdue: ['Maya', 'Jordan', 'Priya', 'Sam', 'Leo', 'Ana', 'Chris', 'Noor'],
  default: ['Kai', 'Mina', 'Jo', 'Ella', 'Marco', 'Dev', 'Rae', 'Sol', 'Ben', 'Lina', 'Theo', 'Ivy'],
};

const NOTES = [
  'get there before 6 or it’s gone',
  'worth the walk',
  'would get again tomorrow',
  'a little salty but still good',
  'late night essential',
  'solid on a cold day',
  'portion is huge, split it',
  'go early, line gets long',
  'kind of dry today',
  '',
  '',
  '',
];

const store = {
  dishes: {},
  places: {},
  reviews: [],
  rankings: {}, // uid -> { dishId -> ranking }
  users: { [DEMO_UID]: { id: DEMO_UID, name: 'Guest', handle: 'guest', following: [] } },
  deals: [],
};

function addReview({ id, user, dish, verdict, score, note, tags, createdAt, previous, likedBy = [] }) {
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
    userId: user.id,
    userName: user.name,
    campusId: dish.campusId,
    placeId: dish.placeId,
    placeName: dish.placeName,
    dishId: dish.id,
    dishName: dish.name,
    verdict,
    score,
    note,
    tags,
    likedBy,
    createdAt,
  });
}

function rank(uid, dish, verdict, elo) {
  store.rankings[uid] = store.rankings[uid] || {};
  store.rankings[uid][dish.id] = {
    dishId: dish.id,
    dishName: dish.name,
    placeId: dish.placeId,
    placeName: dish.placeName,
    campusId: dish.campusId,
    verdict,
    elo,
  };
}

function seedCampus(campus) {
  const rand = rng(campus.id);
  const quality = {};

  campus.places.forEach((place) => {
    menuFor(place, rand).forEach((item) => {
      const id = dishIdFor(place.id, item.name);
      quality[id] = 5.4 + rand() * 4.2;
      store.dishes[id] = {
        id,
        campusId: campus.id,
        placeId: place.id,
        placeName: place.name,
        tags: tagsFor(item.name),
        score: null,
        ratingCount: 0,
        ...item,
      };
    });
  });

  const dishIds = Object.keys(quality);
  const names = campus.id === 'purdue' ? NAMES.purdue : [...NAMES.default].sort(() => rand() - 0.5).slice(0, 6);
  const people = names.map((name) => {
    const id = `${campus.id}-${name.toLowerCase()}`;
    const user = { id, name, handle: `${name.toLowerCase()}.${campus.id}`, campusId: campus.id, following: [] };
    store.users[id] = user;
    return user;
  });

  let n = 0;
  people.forEach((user, p) => {
    const mine = [...dishIds].sort(() => rand() - 0.5).slice(0, 5 + Math.floor(rand() * 4));
    mine.forEach((dishId, k) => {
      const score = Math.round(Math.min(9.8, Math.max(2.5, quality[dishId] + (rand() - 0.5) * 2.4)) * 10) / 10;
      const verdict = verdictFor(score);
      const dish = store.dishes[dishId];
      // the first couple reviews from each person happened today, the rest over the last two weeks
      const minutes = k < 1 ? 15 + p * 70 + rand() * 60 : 600 + rand() * 20000;
      addReview({
        id: `seed-${campus.id}-${n++}`,
        user,
        dish,
        verdict,
        score,
        note: pick(rand, NOTES),
        tags: REASONS.filter(() => rand() < 0.22).map((r) => r.id),
        createdAt: ago(minutes),
        likedBy: people.filter(() => rand() < 0.3).map((u) => u.id),
      });
      rank(user.id, dish, verdict, eloFor(score));
    });
  });

  const spots = campus.places.filter((pl) => pl.kind === 'spot');
  const DEAL_IDEAS = [
    ['Student discount with ID', '10% off with a student ID', []],
    ['$2 off before 11am', 'Any breakfast item', ['Mon', 'Wed', 'Fri']],
    ['Free drink with a combo', 'Fountain drink or iced tea', ['Tue']],
    ['Half off the second item', 'Bring a friend', ['Thu']],
    ['Late-night menu after 9pm', 'Smaller plates, smaller prices', []],
  ];
  spots.slice(0, 3).forEach((spot, i) => {
    const [title, details, days] = DEAL_IDEAS[(i + campus.id.length) % DEAL_IDEAS.length];
    store.deals.push({
      id: `deal-${spot.id}`,
      campusId: campus.id,
      placeId: spot.id,
      placeName: spot.name,
      title,
      details,
      days,
      ends: null,
      postedBy: people[i % people.length].id,
      postedByName: people[i % people.length].name,
      votes: people.filter(() => rand() < 0.5).map((u) => u.id),
      createdAt: ago(1000 + i * 900),
    });
  });

  store.quality = { ...store.quality, ...quality };
}

CAMPUSES.forEach(seedCampus);

// once you pick a school, give "you" a bit of history there and a few friends
function seedYou(campusId) {
  const you = store.users[DEMO_UID];
  store.rankings[DEMO_UID] = {};
  store.reviews = store.reviews.filter((r) => r.userId !== DEMO_UID);
  const best = Object.values(store.dishes)
    .filter((d) => d.campusId === campusId)
    .sort((a, b) => store.quality[b.id] - store.quality[a.id])
    .slice(0, 4);
  const plan = [
    ['love', 1240, 'extra sauce, always', ['flavor'], 200],
    ['love', 1185, '', ['portion'], 1500],
    ['love', 1140, 'worth the walk', ['value', 'flavor'], 3000],
    ['fine', 1010, '', ['quick'], 4400],
  ];
  best.forEach((dish, i) => {
    const [verdict, elo, note, tags, minutes] = plan[i];
    addReview({
      id: `mine-${dish.id}`,
      user: you,
      dish,
      verdict,
      score: toTen(elo),
      note,
      tags,
      createdAt: ago(minutes),
    });
    rank(DEMO_UID, dish, verdict, elo);
  });
  you.following = Object.values(store.users)
    .filter((u) => u.campusId === campusId && u.id !== DEMO_UID)
    .slice(0, 3)
    .map((u) => u.id);

  // make sure each friend has had a few of the same dishes, so taste match has something to compare
  const rand = rng(`${campusId}-friends`);
  you.following.forEach((uid, f) => {
    const friend = store.users[uid];
    best.slice(0, 3 + (f % 2)).forEach((dish, i) => {
      if (store.rankings[uid]?.[dish.id]) return;
      const lean = f === 0 ? 0.4 : f === 1 ? -0.8 : -2.2; // one close match, one so-so, one opposite
      const score = Math.round(Math.min(9.8, Math.max(2.5, toTen(plan[i][1]) + lean + (rand() - 0.5))) * 10) / 10;
      const verdict = verdictFor(score);
      addReview({
        id: `friend-${uid}-${dish.id}`,
        user: friend,
        dish,
        verdict,
        score,
        note: pick(rand, NOTES),
        tags: [],
        createdAt: ago(300 + rand() * 9000),
      });
      rank(uid, dish, verdict, eloFor(score));
    });
  });
}

// --- api -----------------------------------------------------------------

const wait = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 120));
const byScore = (a, b) => (b.score ?? -1) - (a.score ?? -1);
const newestFirst = (rows) => [...rows].sort((a, b) => b.createdAt - a.createdAt);
// screens hold on to rows, so hand out copies (dates stay Dates)
const copy = (rows) => rows.map((r) => ({ ...r, likedBy: [...(r.likedBy || [])], votes: r.votes && [...r.votes] }));

export const getProfile = async (uid) => wait({ ...store.users[uid] });
export async function saveProfile(uid, data) {
  const user = store.users[uid];
  const switching = data.campusId && data.campusId !== user.campusId;
  Object.assign(user, data);
  if (uid === DEMO_UID && data.name) user.handle = data.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'guest';
  if (switching && getCampus(data.campusId)) seedYou(data.campusId);
}

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

export const myRankings = async (uid) => wait(Object.values(store.rankings[uid] || {}).sort((a, b) => b.elo - a.elo));
export const myRanking = async (uid, dishId) => wait(store.rankings[uid]?.[dishId] || null);

export async function saveReview({ userName, dish, verdict, elo, tags, note }) {
  const old = store.rankings[DEMO_UID]?.[dish.id];
  addReview({
    id: `demo-${Date.now()}`,
    user: { ...store.users[DEMO_UID], name: userName },
    dish,
    verdict,
    score: toTen(elo),
    note: note.trim(),
    tags,
    createdAt: new Date(),
    previous: old ? { score: toTen(old.elo), verdict: old.verdict } : null,
  });
  rank(DEMO_UID, dish, verdict, elo);
  return wait();
}

const reviewsWhere = (test, count) => wait(copy(newestFirst(store.reviews.filter(test)).slice(0, count)));
export const campusFeed = async (campusId, count = 30) => reviewsWhere((r) => r.campusId === campusId, count);
export const dishReviews = async (dishId, count = 5) => reviewsWhere((r) => r.dishId === dishId, count);
export const placeReviews = async (placeId, count = 8) => reviewsWhere((r) => r.placeId === placeId, count);
export const userReviews = async (uid) => reviewsWhere((r) => r.userId === uid, 500);
export const friendsFeed = async (uids, count = 30) => reviewsWhere((r) => uids.includes(r.userId), count);

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

export const getUser = async (uid) => wait(store.users[uid] ? { ...store.users[uid] } : null);
export const findUserByHandle = async (handle) =>
  wait(Object.values(store.users).find((u) => u.handle === handle.replace(/^@/, '').toLowerCase()) || null);
export const campusPeople = async (campusId) =>
  wait(Object.values(store.users).filter((u) => u.campusId === campusId && u.id !== DEMO_UID));
export const usersByIds = async (uids) => wait(uids.map((id) => store.users[id]).filter(Boolean));
export async function setFollowing(uid, otherUid, on) {
  const user = store.users[uid];
  const others = user.following.filter((id) => id !== otherUid);
  user.following = on ? [...others, otherUid] : others;
}

export const campusDeals = async (campusId) =>
  wait(copy(store.deals.filter((d) => d.campusId === campusId)).sort((a, b) => b.votes.length - a.votes.length));
export async function addDeal(deal) {
  store.deals.unshift({ ...deal, id: `deal-${Date.now()}`, votes: [], createdAt: new Date() });
}
export async function setDealVote(dealId, uid, on) {
  const deal = store.deals.find((d) => d.id === dealId);
  if (!deal) return;
  const others = deal.votes.filter((id) => id !== uid);
  deal.votes = on ? [...others, uid] : others;
}
