"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from './axiosConfig';

interface Page { url: string }
interface Me { pages: Page[]; roles?: string[]; id?: string; email?: string }

interface SessionValue {
  me: Me | null;
  loading: boolean;
  refreshMe: () => Promise<Me | null>;
}

const SessionContext = createContext<SessionValue>({
  me: null,
  loading: true,
  refreshMe: async () => null,
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

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    void refreshMe();
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
