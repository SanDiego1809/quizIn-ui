"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the content-box size of the element behind `ref` using the
 * native ResizeObserver API. Returns `null` until the first measurement
 * is available (and on the server, where ResizeObserver doesn't exist).
 */
export function useResizeObserver(ref) {
  const [dimensions, setDimensions] = useState(null);

  useEffect(() => {
    const target = ref.current;
    if (!target || typeof ResizeObserver === "undefined") return undefined;

    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => setDimensions(entry.contentRect));
    });
    resizeObserver.observe(target);

    return () => resizeObserver.unobserve(target);
  }, [ref]);

  return dimensions;
}

export default useResizeObserver;
