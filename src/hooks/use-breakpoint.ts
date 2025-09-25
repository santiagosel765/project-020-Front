import { useEffect, useState } from "react";

const queries: Record<string, string> = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
};

export function useBreakpoint<Key extends keyof typeof queries>(key: Key) {
  const query = queries[key];
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || !query) {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const listener = () => setMatches(mq.matches);
    listener();
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
