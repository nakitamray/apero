// Proving you're at a school: your account's email has to be a verified address at that school's
// domain (subdomains count, e.g. g.ucla.edu or andrew.cmu.edu). Firebase sends the link, for free.
// firestore.rules checks the same domains, so a school change can't skip this.
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  verifyBeforeUpdateEmail,
} from 'firebase/auth';

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

export function emailFits(email, campusId) {
  const host = String(email || '')
    .trim()
    .toLowerCase()
    .split('@')[1];
  return !!host && (DOMAINS[campusId] || []).some((d) => host === d || host.endsWith(`.${d}`));
}

export const verifiedFor = (user, campusId) => !!user?.emailVerified && emailFits(user.email, campusId);

// same address as the account: just verify it. a different one: Firebase checks it first,
// then it becomes the email you log in with
export function sendSchoolLink(user, email) {
  const clean = email.trim().toLowerCase();
  if (user.email?.toLowerCase() === clean) return sendEmailVerification(user);
  return verifyBeforeUpdateEmail(user, clean);
}

// Firebase asks for your password again before changing the email on an account you logged into a while ago
export const confirmPassword = (user, password) =>
  reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));

// after you've clicked the link: re-read the account, and refresh its token so the database sees the new email
export async function checkSchool(user, campusId) {
  await reload(user);
  if (!verifiedFor(user, campusId)) return false;
  await user.getIdToken(true);
  return true;
}
