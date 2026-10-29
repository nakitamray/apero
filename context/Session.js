import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { getProfile, saveProfile, setDemoMode } from '../lib/api';
import { DEMO_UID } from '../lib/demoApi';
import { getCampus } from '../data/campuses';
import { defaultModes } from '../lib/trip';

const SessionContext = createContext(null);

// the website embeds the app with ?demo=1 so visitors land straight in the demo
const demoFromUrl = Platform.OS === 'web' && typeof window !== 'undefined' && /[?&]demo=1/.test(window.location.search);
if (demoFromUrl) setDemoMode(true);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined while firebase is still checking
  const [profile, setProfile] = useState(null);
  const [demo, setDemo] = useState(demoFromUrl);

  useEffect(() => {
    if (!auth) {
      // no firebase config (e.g. a demo-only web build)
      setUser(null);
      return undefined;
    }
    return onAuthStateChanged(auth, async (next) => {
      setProfile(next ? await getProfile(next.uid).catch(() => null) : null);
      setUser(next);
    });
  }, []);

  useEffect(() => {
    if (demo) getProfile(DEMO_UID).then(setProfile);
  }, [demo]);

  const value = useMemo(() => {
    const current = demo ? { uid: DEMO_UID, displayName: 'Guest' } : user;
    const campus = getCampus(profile?.campusId);
    return {
      user: current,
      profile,
      campus,
      demo,
      modes: profile?.getAround || defaultModes(campus),
      name: profile?.name || current?.displayName || current?.email?.split('@')[0] || 'friend',
      loading: demo ? !profile : user === undefined,
      updateProfile: async (patch) => {
        await saveProfile(current.uid, patch);
        setProfile((p) => ({ ...p, ...patch }));
      },
      startDemo: () => {
        setDemoMode(true);
        setDemo(true);
      },
      logOut: () => {
        if (demo) {
          setDemoMode(false);
          setDemo(false);
          setProfile(null);
          return;
        }
        signOut(auth);
      },
    };
  }, [user, profile, demo]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
