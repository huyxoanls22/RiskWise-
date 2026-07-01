import { useSyncExternalStore } from "react";
import type { AppData } from "../lib/types";
import { loadData, saveData } from "./persistence";

/**
 * Minimal external store (no dependencies) backed by localStorage. The data
 * layer is intentionally isolated from React so a future cloud-sync adapter can
 * subscribe to the same change stream and push/pull without touching the UI.
 */
let state: AppData = loadData();
const listeners = new Set<() => void>();

function emit() {
  saveData(state);
  for (const l of listeners) l();
}

export const store = {
  get: (): AppData => state,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Replace state via an immutable updater. */
  update(updater: (prev: AppData) => AppData): void {
    state = updater(state);
    emit();
  },
  /** Replace the whole dataset (used by import / reset). */
  replace(next: AppData): void {
    state = next;
    emit();
  },
};

export function useAppData(): AppData {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

/** Convenience selector hook. */
export function useSelector<T>(selector: (data: AppData) => T): T {
  const data = useAppData();
  return selector(data);
}
