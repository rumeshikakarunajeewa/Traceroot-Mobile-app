import { useDarkMode } from '../store/uiStore';

export function useColorScheme(): 'light' | 'dark' {
  const [isDark] = useDarkMode();
  return isDark ? 'dark' : 'light';
}
