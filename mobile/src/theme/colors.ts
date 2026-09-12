export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentHover: string;
  accentSubtle: string;
  accentBlue: string;
  accentRed: string;
  accentYellow: string;
  border: string;
  borderLight: string;
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  cardShadow: string;
  statusBarStyle: 'dark-content' | 'light-content';
}

export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceSubtle: '#F8FAFC',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  accent: '#0F172A', // Crisp primary dark
  accentHover: '#1E293B',
  accentSubtle: '#F1F5F9',
  accentBlue: '#2563EB', // Selective blue accent
  accentRed: '#DC2626', // Selective red accent (breaking)
  accentYellow: '#D97706', // Selective yellow/amber accent (trending)
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabBarActive: '#0F172A',
  tabBarInactive: '#94A3B8',
  cardShadow: 'rgba(15, 23, 42, 0.05)',
  statusBarStyle: 'dark-content',
};

export const darkColors: ThemeColors = {
  background: '#0B0E14',
  surface: '#121620',
  surfaceElevated: '#181D2A',
  surfaceSubtle: '#0F131C',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  accent: '#F8FAFC', // Crisp primary light in dark mode
  accentHover: '#E2E8F0',
  accentSubtle: '#1E2536',
  accentBlue: '#3B82F6',
  accentRed: '#EF4444',
  accentYellow: '#F59E0B',
  border: '#1E2536',
  borderLight: '#161C2A',
  tabBarBackground: '#0B0E14',
  tabBarBorder: '#1E2536',
  tabBarActive: '#F8FAFC',
  tabBarInactive: '#64748B',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
  statusBarStyle: 'light-content',
};

export const categoryColors: Record<
  string,
  { bg: string; text: string; darkBg: string; darkText: string; accentColor: string }
> = {
  'Top Stories': {
    bg: '#F1F5F9',
    text: '#0F172A',
    darkBg: '#1E293B',
    darkText: '#F8FAFC',
    accentColor: '#0F172A',
  },
  Politics: {
    bg: '#EFF6FF',
    text: '#1D4ED8',
    darkBg: '#1E3A8A33',
    darkText: '#60A5FA',
    accentColor: '#2563EB',
  },
  Business: {
    bg: '#ECFDF5',
    text: '#047857',
    darkBg: '#064E3B33',
    darkText: '#34D399',
    accentColor: '#059669',
  },
  Finance: {
    bg: '#ECFDF5',
    text: '#047857',
    darkBg: '#064E3B33',
    darkText: '#34D399',
    accentColor: '#059669',
  },
  Tech: {
    bg: '#F5F3FF',
    text: '#6D28D9',
    darkBg: '#4C1D9533',
    darkText: '#A78BFA',
    accentColor: '#7C3AED',
  },
  Technology: {
    bg: '#F5F3FF',
    text: '#6D28D9',
    darkBg: '#4C1D9533',
    darkText: '#A78BFA',
    accentColor: '#7C3AED',
  },
  AI: {
    bg: '#F5F3FF',
    text: '#6D28D9',
    darkBg: '#4C1D9533',
    darkText: '#A78BFA',
    accentColor: '#7C3AED',
  },
  Sports: {
    bg: '#FFF7ED',
    text: '#C2410C',
    darkBg: '#7C2D1233',
    darkText: '#FB923C',
    accentColor: '#EA580C',
  },
  World: {
    bg: '#F0FDFA',
    text: '#0F766E',
    darkBg: '#134E4A33',
    darkText: '#2DD4BF',
    accentColor: '#0D9488',
  },
  Entertainment: {
    bg: '#FDF2F8',
    text: '#BE185D',
    darkBg: '#83184333',
    darkText: '#F472B6',
    accentColor: '#DB2777',
  },
  Science: {
    bg: '#EFF6FF',
    text: '#1D4ED8',
    darkBg: '#1E3A8A33',
    darkText: '#60A5FA',
    accentColor: '#2563EB',
  },
  Health: {
    bg: '#FEF2F2',
    text: '#B91C1C',
    darkBg: '#7F1D1D33',
    darkText: '#F87171',
    accentColor: '#DC2626',
  },
  Lifestyle: {
    bg: '#FFFBEB',
    text: '#B45309',
    darkBg: '#78350F33',
    darkText: '#FCD34D',
    accentColor: '#D97706',
  },
  Education: {
    bg: '#F0FDF4',
    text: '#15803D',
    darkBg: '#14532D33',
    darkText: '#86EFAC',
    accentColor: '#16A34A',
  },
  Environment: {
    bg: '#ECFDF5',
    text: '#047857',
    darkBg: '#064E3B33',
    darkText: '#34D399',
    accentColor: '#059669',
  },
  Travel: {
    bg: '#F0FDFA',
    text: '#0F766E',
    darkBg: '#134E4A33',
    darkText: '#2DD4BF',
    accentColor: '#0D9488',
  },
  Food: {
    bg: '#FFF7ED',
    text: '#C2410C',
    darkBg: '#7C2D1233',
    darkText: '#FB923C',
    accentColor: '#EA580C',
  },
  Culture: {
    bg: '#FDF2F8',
    text: '#BE185D',
    darkBg: '#83184333',
    darkText: '#F472B6',
    accentColor: '#DB2777',
  },
  Gaming: {
    bg: '#F5F3FF',
    text: '#6D28D9',
    darkBg: '#4C1D9533',
    darkText: '#A78BFA',
    accentColor: '#7C3AED',
  },
  Automotive: {
    bg: '#F8FAFC',
    text: '#334155',
    darkBg: '#1E293B33',
    darkText: '#94A3B8',
    accentColor: '#475569',
  },
  Breaking: {
    bg: '#FEF2F2',
    text: '#DC2626',
    darkBg: '#7F1D1D44',
    darkText: '#F87171',
    accentColor: '#DC2626',
  },
};
