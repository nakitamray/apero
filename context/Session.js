import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { getProfile, saveProfile } from '../lib/api';
import { getCampus } from '../data/campuses';
import { defaultModes } from '../lib/trip';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined while firebase is still checking
  const [profile, setProfile] = useState(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (next) => {
        setProfile(next ? await getProfile(next.uid).catch(() => null) : null);
        setUser(next);
      }),
    [],
  );

  const value = useMemo(() => {
    const campus = getCampus(profile?.campusId);
    return {
      user,
      profile,
      campus,
      modes: profile?.getAround || defaultModes(campus),
      name: profile?.name || user?.displayName || user?.email?.split('@')[0] || 'friend',
      loading: user === undefined,
      updateProfile: async (patch) => {
        await saveProfile(user.uid, patch);
        setProfile((p) => ({ ...p, ...patch }));
      },
      logOut: () => signOut(auth),
    };
  }, [user, profile]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
