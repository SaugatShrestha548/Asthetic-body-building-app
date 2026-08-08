"use client";

import { useEffect, useRef, useState } from "react";
import { AppState } from "@/lib/types";
import { emptyState } from "@/lib/utils";

const STORAGE_KEY = "abt-state-v1";

/**
 * Persists the whole app state to localStorage. This is what makes the app work fully
 * offline — every screen reads/writes through this hook via `setState`, and the effect
 * below debounces the write to disk. Swap the two effects below for a remote sync layer
 * (Supabase/Firebase) later without touching any component code.
 */
export function useAppState(): [AppState | null, React.Dispatch<React.SetStateAction<AppState>>, boolean] {
  const [state, setState] = useState<AppState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    // One-time hydration from localStorage on mount. This can only run client-side (Next.js
    // has no access to window during SSR), so an effect — not lazy useState init — is required.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const defaults = emptyState();
      const parsed = raw ? JSON.parse(raw) : null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(parsed ? { ...defaults, ...parsed, settings: { ...defaults.settings, ...parsed.settings } } : defaults);
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(emptyState());
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded || !state) return;
    if (first.current) { first.current = false; }
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // storage full or unavailable — fail silently, in-memory state still works this session
      }
    }, 200);
    return () => clearTimeout(t);
  }, [state, loaded]);

  return [state, setState as React.Dispatch<React.SetStateAction<AppState>>, loaded];
}
