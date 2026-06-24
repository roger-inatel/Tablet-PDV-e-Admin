"use client";

import { useEffect, useState } from "react";

/**
 * Reactively tracks a CSS media query. Lazily reads `matchMedia` on the client
 * (guarded for SSR). Consumers that render on the server should gate their
 * usage behind a mounted/hydrated flag to avoid layout mismatch.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
