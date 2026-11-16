// Proving you're at a school, without touching the account you log in with.
//
// 1. You type your student email; Firebase emails it a one-time link (free, "email link" sign-in).
// 2. Opening the link (on any device) signs that address into a separate, throwaway sign-in
//    (schoolAuth), which writes schoolEmails/{email} = { owner: your account }, then signs out.
// 3. Your account keeps the address in users/{uid}/private/school (only you can read it), and
//    firestore.rules only lets your campus change when that address is at the new school AND
//    schoolEmails says it belongs to you.
import { Platform } from 'react-native';
import { isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink, signOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, schoolAuth, schoolDb } from './firebase';

export const DOMAINS = {
  purdue: ['purdue.edu'],
  ucla: ['ucla.edu'],
  usc: ['usc.edu'],
  berkeley: ['berkeley.edu'],
  stanford: ['stanford.edu'],
  uci: ['uci.edu'],
  ucr: ['ucr.edu'],
  mit: ['mit.edu'],
  nyu: ['nyu.edu'],
  cmu: ['cmu.edu'],
  uw: ['uw.edu'],
  uiuc: ['illinois.edu'],
  erau: ['erau.edu'],
};

export const domainFor = (campusId) => DOMAINS[campusId]?.[0] || 'school.edu';
const clean = (email) =>
  String(email || '')
    .trim()
    .toLowerCase();

export function emailFits(email, campusId) {
  const host = clean(email).split('@')[1];
  return !!host && (DOMAINS[campusId] || []).some((d) => host === d || host.endsWith(`.${d}`));
}

const web = Platform.OS === 'web' && typeof window !== 'undefined';

// where the emailed link opens: the website's copy of the app
function appUrl() {
  if (web) {
    const base = window.location.pathname.match(/^(.*?\/app)(?=\/|$)/)?.[1] ?? '';
    return `${window.location.origin}${base}/`;
  }
  const site = process.env.EXPO_PUBLIC_SITE_URL;
  return site ? `${site.replace(/\/$/, '')}/app/` : null;
}

const privateDoc = (uid) => doc(db, 'users', uid, 'private', 'school');

// your private note of which student email you're checking, and for which school
export async function schoolNote(uid) {
  const snap = await getDoc(privateDoc(uid)).catch(() => null);
  return snap?.exists() ? snap.data() : null;
}

export const clearPendingSchool = (uid) => setDoc(privateDoc(uid), { pendingCampusId: null }, { merge: true });

export async function sendSchoolLink(uid, email, campusId) {
  const url = appUrl();
  if (!url || !schoolAuth) throw Object.assign(new Error('no site'), { code: 'apero/no-site' });
  const address = clean(email);
  await setDoc(privateDoc(uid), { email: address, pendingCampusId: campusId }, { merge: true });
  await sendSignInLinkToEmail(schoolAuth, address, {
    url: `${url}?school=1&uid=${encodeURIComponent(uid)}&campus=${encodeURIComponent(campusId)}`,
    handleCodeInApp: true,
  });
  if (web) {
    try {
      window.localStorage.setItem('apero-school-email', address);
    } catch {
      // the link page will just ask for the address again
    }
  }
}

// has the link been opened, so the address now counts as yours?
export async function schoolConfirmed(uid, email) {
  const snap = await getDoc(doc(db, 'schoolEmails', clean(email))).catch(() => null);
  return !!snap?.exists() && snap.data().owner === uid;
}

// --- the page the emailed link opens --------------------------------------------------------

export const isSchoolLink = () =>
  web &&
  !!schoolAuth &&
  /[?&]school=1/.test(window.location.search) &&
  isSignInWithEmailLink(schoolAuth, window.location.href);

export function rememberedSchoolEmail() {
  try {
    return window.localStorage.getItem('apero-school-email') || '';
  } catch {
    return '';
  }
}

export async function finishSchoolLink(email) {
  const params = new URLSearchParams(window.location.search);
  const owner = params.get('uid');
  const campusId = params.get('campus');
  const address = clean(email);
  await signInWithEmailLink(schoolAuth, address, window.location.href);
  try {
    await setDoc(doc(schoolDb, 'schoolEmails', address), { owner, campusId, at: serverTimestamp() });
  } finally {
    await signOut(schoolAuth);
  }
  try {
    window.localStorage.removeItem('apero-school-email');
  } catch {
    // nothing to clean up
  }
  return { campusId };
}
