import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { toTen } from './score';
import { startOfToday } from './time';

const withId = (snap) => ({ id: snap.id, ...snap.data() });
const list = async (q) => (await getDocs(q)).docs.map(withId);
const asDate = (ts) => (ts?.toDate ? ts.toDate() : null);
const withDate = (review) => ({ ...review, createdAt: asDate(review.createdAt) });

export const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);

export const dishIdFor = (placeId, name) => `${placeId}__${slugify(name)}`;

// users

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export const saveProfile = (uid, data) => setDoc(doc(db, 'users', uid), data, { merge: true });

// dishes

export async function getDish(id) {
  const snap = await getDoc(doc(db, 'dishes', id));
  return snap.exists() ? withId(snap) : null;
}

export const campusDishes = (campusId) => list(query(collection(db, 'dishes'), where('campusId', '==', campusId)));

export const placeDishes = (placeId) => list(query(collection(db, 'dishes'), where('placeId', '==', placeId)));

export async function topDishes(campusId, count = 8) {
  const rows = await list(
    query(collection(db, 'dishes'), where('campusId', '==', campusId), orderBy('score', 'desc'), limit(count)),
  );
  return rows.filter((d) => d.ratingCount > 0);
}

export async function moodDishes(campusId, tag) {
  const rows = await list(
    query(collection(db, 'dishes'), where('campusId', '==', campusId), where('tags', 'array-contains', tag)),
  );
  return rows.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export async function addDish({ place, name, tags, uid }) {
  const id = dishIdFor(place.id, name);
  const ref = doc(db, 'dishes', id);
  const existing = await getDoc(ref);
  if (existing.exists()) return withId(existing);
  const dish = {
    name: name.trim(),
    campusId: place.campusId,
    placeId: place.id,
    placeName: place.name,
    tags,
    ratingSum: 0,
    ratingCount: 0,
    score: null,
    addedBy: uid,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, dish);
  return { id, ...dish };
}

// rankings + reviews

export async function myRankings(uid) {
  const rows = await list(collection(db, 'users', uid, 'rankings'));
  return rows.sort((a, b) => b.elo - a.elo);
}

export async function myRanking(uid, dishId) {
  const snap = await getDoc(doc(db, 'users', uid, 'rankings', dishId));
  return snap.exists() ? snap.data() : null;
}

// Writes the review, the user's ranking and the dish's running average together.
// If you've ranked this dish before, your old score is swapped out of the average.
export async function saveReview({ uid, userName, dish, verdict, elo, tags, note }) {
  const rankingRef = doc(db, 'users', uid, 'rankings', dish.id);
  const dishRef = doc(db, 'dishes', dish.id);
  const score = toTen(elo);

  await runTransaction(db, async (tx) => {
    const previous = await tx.get(rankingRef);
    const dishSnap = await tx.get(dishRef);
    const current = dishSnap.data() || {};

    let sum = current.ratingSum || 0;
    let count = current.ratingCount || 0;
    if (previous.exists()) {
      sum += score - toTen(previous.data().elo);
    } else {
      sum += score;
      count += 1;
    }

    tx.set(dishRef, { ratingSum: sum, ratingCount: count, score: Math.round((sum / count) * 10) / 10 }, { merge: true });
    tx.set(rankingRef, {
      dishId: dish.id,
      dishName: dish.name,
      placeId: dish.placeId,
      placeName: dish.placeName,
      campusId: dish.campusId,
      verdict,
      elo,
      updatedAt: serverTimestamp(),
    });
    tx.set(doc(collection(db, 'reviews')), {
      userId: uid,
      userName,
      campusId: dish.campusId,
      placeId: dish.placeId,
      placeName: dish.placeName,
      dishId: dish.id,
      dishName: dish.name,
      verdict,
      score,
      tags,
      note: note.trim(),
      likedBy: [],
      createdAt: serverTimestamp(),
    });
  });
}

export async function campusFeed(campusId, count = 30) {
  const rows = await list(
    query(collection(db, 'reviews'), where('campusId', '==', campusId), orderBy('createdAt', 'desc'), limit(count)),
  );
  return rows.map(withDate);
}

export async function dishReviews(dishId, count = 5) {
  const rows = await list(
    query(collection(db, 'reviews'), where('dishId', '==', dishId), orderBy('createdAt', 'desc'), limit(count)),
  );
  return rows.map(withDate);
}

export async function userReviews(uid) {
  const rows = await list(query(collection(db, 'reviews'), where('userId', '==', uid), orderBy('createdAt', 'desc')));
  return rows.map(withDate);
}

// how many reviews each place got today, for the "busy right now" bits
export async function activityToday(campusId) {
  const rows = await list(
    query(
      collection(db, 'reviews'),
      where('campusId', '==', campusId),
      where('createdAt', '>=', Timestamp.fromDate(startOfToday())),
    ),
  );
  return rows.reduce((counts, r) => ({ ...counts, [r.placeId]: (counts[r.placeId] || 0) + 1 }), {});
}

export const setLiked = (reviewId, uid, liked) =>
  updateDoc(doc(db, 'reviews', reviewId), { likedBy: liked ? arrayUnion(uid) : arrayRemove(uid) });
