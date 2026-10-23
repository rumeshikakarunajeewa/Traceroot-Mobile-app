import { useState, useEffect } from 'react';

// In-memory reactive state for app-wide UI theme & preferences
let currentDarkMode = false;
const listeners = new Set<(isDark: boolean) => void>();

function notify() {
  listeners.forEach((listener) => listener(currentDarkMode));
}

export function setDarkMode(isDark: boolean) {
  currentDarkMode = isDark;
  notify();
}

export function toggleDarkMode() {
  currentDarkMode = !currentDarkMode;
  notify();
}

export function getIsDarkMode(): boolean {
  return currentDarkMode;
}

/**
 * React hook to subscribe to dark mode state changes
 */
export function useDarkMode(): [boolean, (isDark: boolean) => void] {
  const [isDark, setIsDark] = useState<boolean>(currentDarkMode);

  useEffect(() => {
    const listener = (newVal: boolean) => setIsDark(newVal);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return [isDark, setDarkMode];
}
