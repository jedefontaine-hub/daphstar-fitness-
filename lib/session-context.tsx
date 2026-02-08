"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface CustomerSession {
  id: string;
  name: string;
  email: string;
  retirementVillage?: string;
}

interface SessionContextType {
  customer: CustomerSession | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.authenticated) {
        setCustomer(data.customer);
      } else {
        setCustomer(null);
      }
    } catch {
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCustomer(null);
  };

  const refresh = async () => {
    setIsLoading(true);
    await fetchSession();
  };

  return (
    <SessionContext.Provider value={{ customer, isLoading, logout, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
