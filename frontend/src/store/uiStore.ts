import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY_DARK_MODE = '@traceroot_dark_mode_v1';

// In-memory reactive state for app-wide UI theme & preferences
let currentDarkMode = false;
let isLoadedFromStorage = false;
const listeners = new Set<(isDark: boolean) => void>();

function notify() {
  listeners.forEach((listener) => listener(currentDarkMode));
}

export async function loadDarkModeFromStorage() {
  if (isLoadedFromStorage) return;
  isLoadedFromStorage = true;
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_DARK_MODE);
    if (saved !== null) {
      currentDarkMode = JSON.parse(saved);
      notify();
    }
  } catch (err) {
    console.warn('Failed to load dark mode from AsyncStorage:', err);
  }
}

export function setDarkMode(isDark: boolean) {
  currentDarkMode = isDark;
  notify();
  AsyncStorage.setItem(STORAGE_KEY_DARK_MODE, JSON.stringify(isDark)).catch((err) =>
    console.warn('Failed to persist dark mode:', err)
  );
}

export function toggleDarkMode() {
  setDarkMode(!currentDarkMode);
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
    loadDarkModeFromStorage();
    const listener = (newVal: boolean) => setIsDark(newVal);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return [isDark, setDarkMode];
}
