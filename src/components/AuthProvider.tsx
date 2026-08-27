'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AccountProfile } from '@/features/account/model';
import { getMyAccountProfile } from '@/features/account/repository';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: AccountProfile | null;
  profileLoading: boolean;
  profileAvailable: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  profileLoading: false,
  profileAvailable: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileAvailable, setProfileAvailable] = useState(true);
  const profileRequestId = useRef(0);
  const currentUserId = session?.user?.id ?? null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      profileRequestId.current += 1;
      setSession(newSession);
      setProfile(null);
      setProfileLoading(false);
      setProfileAvailable(true);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const refreshProfile = useCallback(async () => {
    const requestId = ++profileRequestId.current;
    if (!currentUserId) {
      setProfile(null);
      setProfileLoading(false);
      setProfileAvailable(true);
      return;
    }

    setProfileLoading(true);
    try {
      const snapshot = await getMyAccountProfile();
      if (requestId !== profileRequestId.current) return;
      setProfile(snapshot.profile);
      setProfileAvailable(snapshot.available);
    } catch {
      if (requestId !== profileRequestId.current) return;
      setProfile(null);
      setProfileAvailable(false);
    } finally {
      if (requestId === profileRequestId.current) setProfileLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refreshProfile();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [refreshProfile]);

  return (
    <AuthContext.Provider value={{
      user: session?.user ?? null,
      session,
      loading,
      profile,
      profileLoading,
      profileAvailable,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
