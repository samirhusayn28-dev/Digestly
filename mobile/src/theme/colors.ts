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
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  accent: '#0D9488', // Deep editorial teal
  accentHover: '#0F766E',
  accentSubtle: '#CCFBF1',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabBarActive: '#0D9488',
  tabBarInactive: '#94A3B8',
  cardShadow: 'rgba(15, 23, 42, 0.06)',
  statusBarStyle: 'dark-content',
};

export const darkColors: ThemeColors = {
  background: '#0B0F17',
  surface: '#131B29',
  surfaceElevated: '#1A2436',
  surfaceSubtle: '#101622',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  accent: '#14B8A6', // Radiant editorial teal
  accentHover: '#2DD4BF',
  accentSubtle: '#134E4A',
  border: '#1E293B',
  borderLight: '#172234',
  tabBarBackground: '#101622',
  tabBarBorder: '#1E293B',
  tabBarActive: '#14B8A6',
  tabBarInactive: '#64748B',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
  statusBarStyle: 'light-content',
};

export const categoryColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  Politics: {
    bg: '#EFF6FF',
    text: '#2563EB',
    darkBg: '#1E3A8A44',
    darkText: '#60A5FA',
  },
  Sports: {
    bg: '#FFF7ED',
    text: '#EA580C',
    darkBg: '#7C2D1244',
    darkText: '#FB923C',
  },
  Tech: {
    bg: '#F5F3FF',
    text: '#7C3AED',
    darkBg: '#4C1D9544',
    darkText: '#A78BFA',
  },
  Business: {
    bg: '#ECFDF5',
    text: '#059669',
    darkBg: '#064E3B44',
    darkText: '#34D399',
  },
  Entertainment: {
    bg: '#FDF2F8',
    text: '#DB2777',
    darkBg: '#83184344',
    darkText: '#F472B6',
  },
  World: {
    bg: '#F0FDFA',
    text: '#0D9488',
    darkBg: '#134E4A44',
    darkText: '#2DD4BF',
  },
  Breaking: {
    bg: '#FEF2F2',
    text: '#DC2626',
    darkBg: '#7F1D1D44',
    darkText: '#F87171',
  },
};
