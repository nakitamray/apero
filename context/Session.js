import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getProfile, saveProfile, setDemoMode, setFollowing } from '../lib/api';
import { DEMO_UID } from '../lib/demoApi';
import { getCampus } from '../data/campuses';
import { defaultModes } from '../lib/trip';
import { clearPendingSchool, emailFits, schoolConfirmed, schoolNote } from '../lib/school';

const SessionContext = createContext(null);

// the website embeds the app with ?demo=1 so visitors land straight in the demo. the address changes as
// you move around (and loses the ?demo=1), so the tab remembers it until you leave the demo
const web = Platform.OS === 'web' && typeof window !== 'undefined';
const remember = (on) => {
  try {
    if (on) window.sessionStorage.setItem('apero-demo', '1');
    else window.sessionStorage.removeItem('apero-demo');
  } catch {
    // private windows can refuse storage; the demo still works, it just won't survive a refresh
  }
};
const remembered = () => {
  try {
    return window.sessionStorage.getItem('apero-demo') === '1';
  } catch {
    return false;
  }
};
// the school you picked in the demo, so a refresh lands back on the same page
const demoSchool = {
  get: () => {
    try {
      return JSON.parse(window.sessionStorage.getItem('apero-demo-school') || 'null');
    } catch {
      return null;
    }
  },
  set: (value) => {
    try {
      if (value) window.sessionStorage.setItem('apero-demo-school', JSON.stringify(value));
      else window.sessionStorage.removeItem('apero-demo-school');
    } catch {
      // fine without it
    }
  },
};
const demoFromUrl = web && (/[?&]demo=1/.test(window.location.search) || remembered());
if (demoFromUrl) {
  setDemoMode(true);
  remember(true);
}

export function SessionProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined while firebase is still checking
  const [profile, setProfile] = useState(null);
  const [demo, setDemo] = useState(demoFromUrl);
  // left the demo to log in or sign up: those screens offer a way back
  const [wasDemo, setWasDemo] = useState(false);

  useEffect(() => {
    if (!auth) {
      // no firebase config (e.g. a demo-only web build)
      setUser(null);
      return undefined;
    }
    return onAuthStateChanged(auth, async (next) => {
      let p = next ? await getProfile(next.uid).catch(() => null) : null;
      // a school switch waiting on its email link finishes here once the link has been opened (on any device)
      if (next) {
        const note = await schoolNote(next.uid);
        if (note?.pendingCampusId && emailFits(note.email, note.pendingCampusId)) {
          try {
            if (await schoolConfirmed(next.uid, note.email)) {
              await saveProfile(next.uid, { campusId: note.pendingCampusId });
              await clearPendingSchool(next.uid);
              p = await getProfile(next.uid);
            }
          } catch {
            // leave it pending; the school page can finish it
          }
        }
      }
      setProfile(p);
      setUser(next);
    });
  }, []);

  useEffect(() => {
    if (!demo) return;
    (async () => {
      const saved = web ? demoSchool.get() : null;
      if (saved?.campusId) await saveProfile(DEMO_UID, saved);
      setProfile(await getProfile(DEMO_UID));
    })();
  }, [demo]);

  const value = useMemo(() => {
    const current = demo ? { uid: DEMO_UID, displayName: 'Guest' } : user;
    const campus = getCampus(profile?.campusId);
    return {
      user: current,
      profile,
      campus,
      demo,
      wasDemo,
      modes: profile?.getAround || defaultModes(campus),
      name: profile?.name || current?.displayName || current?.email?.split('@')[0] || 'friend',
      loading: demo ? !profile : user === undefined,
      following: profile?.following || [],
      updateProfile: async (patch) => {
        await saveProfile(current.uid, patch);
        if (demo && web && patch.campusId) demoSchool.set({ campusId: patch.campusId, getAround: patch.getAround });
        // re-read: saving can change more than the patch (the demo hands you friends when you pick a school)
        setProfile(await getProfile(current.uid));
      },
      follow: async (otherUid, on) => {
        setProfile((p) => {
          const others = (p.following || []).filter((id) => id !== otherUid);
          return { ...p, following: on ? [...others, otherUid] : others };
        });
        await setFollowing(current.uid, otherUid, on);
      },
      startDemo: () => {
        if (web) remember(true);
        setDemoMode(true);
        setDemo(true);
      },
      logOut: () => {
        if (demo) {
          // the demo school is kept, so going back to the demo lands where you were
          if (web) remember(false);
          setWasDemo(true);
          setDemoMode(false);
          setDemo(false);
          setProfile(null);
          return;
        }
        signOut(auth);
      },
    };
  }, [user, profile, demo, wasDemo]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
