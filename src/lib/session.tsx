"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { api } from './axiosConfig';

interface Page { url: string }
interface Me { pages: Page[]; roles?: string[]; id?: string; email?: string }

interface SessionValue {
  me: Me | null;
  loading: boolean;
  refreshMe: () => Promise<Me | null>;
  signOut: () => Promise<void>;    
}

const SessionContext = createContext<SessionValue>({
  me: null,
  loading: true,
  refreshMe: async () => null,
  signOut: async () => {},     
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  const refreshMe = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Me>('/users/me');
      setMe(data);
      return data;
    } catch (e) {
      setMe(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setMe(null); 
    }
  }, []);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    void refreshMe();
  }, [refreshMe]);

    const value = useMemo(() => ({ me, loading, refreshMe, signOut }), [me, loading, refreshMe, signOut]);
    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
  }

export function useSession() {
  return useContext(SessionContext);
}
