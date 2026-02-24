"use client";

import { useState, useEffect } from "react";

/**
 * Debounce a value by the specified delay.
 * Returns the debounced value which only updates after the user
 * stops changing the input for `delay` milliseconds.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default 400ms)
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
