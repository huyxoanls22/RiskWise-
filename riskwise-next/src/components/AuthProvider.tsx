import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const AuthCtx = createContext<AuthState>({ session: null, user: null, loading: true });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthCtx.Provider value={{ session, user: session?.user ?? null, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}

/** Thin wrappers over Supabase auth so components don't import the client directly. */
export const authActions = {
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password }),
  signUp: (email: string, password: string) =>
    supabase.auth.signUp({ email: email.trim().toLowerCase(), password }),
  signOut: () => supabase.auth.signOut(),
};
