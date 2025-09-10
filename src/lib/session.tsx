"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './axiosConfig';

interface Page { url: string }
interface Me { pages: Page[]; roles?: string[] }

interface SessionValue {
  me: Me | null;
  loading: boolean;
  refreshMe: () => Promise<void>;
}

const SessionContext = createContext<SessionValue>({
  me: null,
  loading: true,
  refreshMe: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Me>('/users/me');
      setMe(data);
    } catch (e) {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  return (
    <SessionContext.Provider value={{ me, loading, refreshMe }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
