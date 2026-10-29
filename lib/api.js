// Screens talk to this file. It forwards to Firebase, or to the in-memory demo
// when someone taps "Try the demo" (or opens the web build with ?demo=1).
import * as live from './firebaseApi';
import * as demo from './demoApi';

let backend = live;

export const setDemoMode = (on) => {
  backend = on ? demo : live;
};

const forward =
  (name) =>
  (...args) =>
    backend[name](...args);

export const getProfile = forward('getProfile');
export const saveProfile = forward('saveProfile');
export const getDish = forward('getDish');
export const campusDishes = forward('campusDishes');
export const placeDishes = forward('placeDishes');
export const topDishes = forward('topDishes');
export const moodDishes = forward('moodDishes');
export const addDish = forward('addDish');
export const myRankings = forward('myRankings');
export const myRanking = forward('myRanking');
export const saveReview = forward('saveReview');
export const campusFeed = forward('campusFeed');
export const dishReviews = forward('dishReviews');
export const placeReviews = forward('placeReviews');
export const userReviews = forward('userReviews');
export const campusPlaceStats = forward('campusPlaceStats');
export const getPlaceStats = forward('getPlaceStats');
export const topPlacesWorld = forward('topPlacesWorld');
export const activityToday = forward('activityToday');
export const setLiked = forward('setLiked');
