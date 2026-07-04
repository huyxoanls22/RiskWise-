import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { useToast } from "./Toast";
import { store } from "../store/store";
import { migrate } from "../store/persistence";
import { defaultData } from "../store/defaults";

/**
 * Bridges the local store with the user's row in public.app_state:
 *  - on login, pulls the cloud blob and hydrates the store (or seeds a fresh row);
 *  - while mounted, pushes every change back up (debounced).
 * Children render only after hydration so a previous user's cached data never flashes.
 */
export function CloudSyncGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const [hydrated, setHydrated] = useState(false);
  const userId = user?.id;

  // Pull cloud state → hydrate the store whenever the signed-in user changes.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setHydrated(false);

    (async () => {
      try {
        const { data, error } = await supabase
          .from("app_state")
          .select("data")
          .eq("user_id", userId)
          .maybeSingle();
        if (cancelled) return;
        if (error) throw error;

        const blob = data?.data as Record<string, unknown> | undefined;
        if (blob && Object.keys(blob).length > 0) {
          store.replace(migrate(blob));
        } else {
          // First time on this account — seed with a clean default and create the row.
          store.replace(defaultData());
          await supabase.from("app_state").upsert({ user_id: userId, data: store.get() });
        }
      } catch {
        if (!cancelled) toast("Không tải được dữ liệu đám mây — đang dùng bản cục bộ.", "error");
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, toast]);

  // Push local changes up to the cloud, debounced.
  useEffect(() => {
    if (!userId || !hydrated) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = store.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // NB: the query builder is lazy — it only fires when .then()/await runs.
        supabase
          .from("app_state")
          .upsert({ user_id: userId, data: store.get() })
          .then(({ error }) => {
            if (error) console.warn("Cloud save failed:", error.message);
          });
      }, 800);
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [userId, hydrated]);

  if (!hydrated) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }
  return <>{children}</>;
}
