import { useDarkMode } from '../store/uiStore';

export const colors = {
  primary: '#187A36',
  primaryLight: '#239345',
  background: '#F8F5F0',
  surface: '#FFFFFF',
  onboardingBackground: '#194228', // Dark green background for onboarding
  text: {
    primary: '#114B25',
    secondary: '#2C5E3D',
    inverse: '#FFFFFF',
    onboarding: '#E8F5E9',
  },
  button: {
    primary: '#187A36',
    secondary: '#F1F4F1',
    secondaryText: '#187A36',
    accent: '#7CD958', // Light green Next button
  },
  buyer: {
    background: '#F5F2EB',
    cardBackground: '#FFFFFF',
    forestDark: '#1E3523',
    forestDarkest: '#16281A',
    sageMint: '#A6C0A1',
    sageLight: '#E8F5E9',
    stoneCream: '#E7E3D8',
    borderLight: '#E5E1D7',
    textDark: '#16301A',
    textMuted: '#6B7E6C',
    badgeBlueBg: '#EBF2FF',
    badgeBlueText: '#3D63DD',
    badgeAmberBg: '#FFF4E5',
    badgeAmberText: '#D97706',
    tabBarBg: '#1B3220',
    tabBarActive: '#FFFFFF',
    tabBarInactive: '#889C8A',
    tabBarIndicator: '#E68A28',
    badgeOrange: '#E66926',
    progressBarBg: '#E2DFD7',
    progressBarFill: '#5D7C49',
  },
};

export const darkColors = {
  primary: '#2EB854',
  primaryLight: '#3CD868',
  background: '#0E1710',
  surface: '#18271C',
  onboardingBackground: '#0B140D',
  text: {
    primary: '#F0F5F1',
    secondary: '#A2BBA6',
    inverse: '#16301A',
    onboarding: '#E8F5E9',
  },
  button: {
    primary: '#247038',
    secondary: '#253A2A',
    secondaryText: '#4ADE80',
    accent: '#7CD958',
  },
  buyer: {
    background: '#0E1710',
    cardBackground: '#18271C',
    forestDark: '#233F29',
    forestDarkest: '#0E1710',
    sageMint: '#A6C0A1',
    sageLight: '#233827',
    stoneCream: '#283D2C',
    borderLight: '#283D2C',
    textDark: '#F0F5F1',
    textMuted: '#9CB3A0',
    badgeBlueBg: '#18293D',
    badgeBlueText: '#60A5FA',
    badgeAmberBg: '#3A2710',
    badgeAmberText: '#FBBF24',
    tabBarBg: '#142517',
    tabBarActive: '#FFFFFF',
    tabBarInactive: '#889C8A',
    tabBarIndicator: '#E68A28',
    badgeOrange: '#E66926',
    progressBarBg: '#2A3F2E',
    progressBarFill: '#4ADE80',
  },
};

export function getThemeColors(isDark: boolean) {
  return isDark ? darkColors : colors;
}

export function useAppColors() {
  const [isDark] = useDarkMode();
  return isDark ? darkColors : colors;
}

export const typography = {
  heading: { fontSize: 42, fontWeight: '600' as const },
  subheading: { fontSize: 18, fontWeight: '500' as const },
  button: { fontSize: 16, fontWeight: '600' as const },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 24,
  full: 9999,
};
