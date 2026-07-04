import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

interface PremiumState {
  premium: boolean;
  tier: "free" | "premium";
  expiresAt: string | null;
  loading: boolean;
  /** Re-fetch the tier from the server (e.g. after the user reports a payment). */
  refresh: () => Promise<void>;
}

const PremiumCtx = createContext<PremiumState>({
  premium: false,
  tier: "free",
  expiresAt: null,
  loading: true,
  refresh: async () => {},
});

export const usePremium = () => useContext(PremiumCtx);

/**
 * Premium entitlement is server-owned: it reads public.profiles.tier (+ expires_at),
 * which only an admin / service_role can change. Clients can never grant themselves
 * premium (they lost UPDATE on profiles).
 */
export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tier, setTier] = useState<"free" | "premium">("free");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = user?.id;

  const refresh = useCallback(async () => {
    if (!userId) {
      setTier("free");
      setExpiresAt(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("tier, expires_at")
      .eq("user_id", userId)
      .maybeSingle();
    setTier(data?.tier === "premium" ? "premium" : "free");
    setExpiresAt(data?.expires_at ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const premium = tier === "premium" && (!expiresAt || new Date(expiresAt).getTime() > Date.now());

  return (
    <PremiumCtx.Provider value={{ premium, tier, expiresAt, loading, refresh }}>
      {children}
    </PremiumCtx.Provider>
  );
}
