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
  textPrimary: '#0F172A', // Deep navy slate
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  accent: '#0F172A', // Crisp primary dark (Financial Times / Apple News editorial tone)
  accentHover: '#1E293B',
  accentSubtle: '#F1F5F9',
  accentBlue: '#1E293B', // Restrained slate accent
  accentRed: '#B91C1C', // Selective quiet red for breaking news
  accentYellow: '#FEF08A', // Marker highlighter yellow
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabBarActive: '#0F172A',
  tabBarInactive: '#94A3B8',
  cardShadow: 'rgba(15, 23, 42, 0.04)',
  statusBarStyle: 'dark-content',
};

export const darkColors: ThemeColors = {
  background: '#07090E', // Deep premium near-black matching mockups
  surface: '#111622', // Card background from mockups
  surfaceElevated: '#182030',
  surfaceSubtle: '#0D111A',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  accent: '#F8FAFC',
  accentHover: '#E2E8F0',
  accentSubtle: '#1E2638',
  accentBlue: '#38BDF8',
  accentRed: '#EF4444',
  accentYellow: '#EAB308',
  border: '#1E2638',
  borderLight: '#151B27',
  tabBarBackground: '#07090E',
  tabBarBorder: '#1E2638',
  tabBarActive: '#F8FAFC',
  tabBarInactive: '#64748B',
  cardShadow: 'rgba(0, 0, 0, 0.5)',
  statusBarStyle: 'light-content',
};

export const categoryColors: Record<
  string,
  { bg: string; text: string; darkBg: string; darkText: string; accentColor: string; icon: string }
> = {
  'Top Stories': {
    bg: '#0F172A',
    text: '#FFFFFF',
    darkBg: '#F8FAFC',
    darkText: '#07090E',
    accentColor: '#F8FAFC',
    icon: 'sparkles-outline',
  },
  'Politics': {
    bg: '#FEF2F2',
    text: '#DC2626',
    darkBg: 'rgba(239, 68, 68, 0.15)',
    darkText: '#F87171',
    accentColor: '#EF4444',
    icon: 'megaphone-outline',
  },
  'Business & Economy': {
    bg: '#ECFDF5',
    text: '#059669',
    darkBg: 'rgba(16, 185, 129, 0.15)',
    darkText: '#34D399',
    accentColor: '#10B981',
    icon: 'trending-up-outline',
  },
  'Business': {
    bg: '#ECFDF5',
    text: '#059669',
    darkBg: 'rgba(16, 185, 129, 0.15)',
    darkText: '#34D399',
    accentColor: '#10B981',
    icon: 'trending-up-outline',
  },
  'Technology & AI': {
    bg: '#EFF6FF',
    text: '#2563EB',
    darkBg: 'rgba(56, 189, 248, 0.15)',
    darkText: '#38BDF8',
    accentColor: '#38BDF8',
    icon: 'hardware-chip-outline',
  },
  'Technology': {
    bg: '#EFF6FF',
    text: '#2563EB',
    darkBg: 'rgba(56, 189, 248, 0.15)',
    darkText: '#38BDF8',
    accentColor: '#38BDF8',
    icon: 'hardware-chip-outline',
  },
  'Tech': {
    bg: '#EFF6FF',
    text: '#2563EB',
    darkBg: 'rgba(56, 189, 248, 0.15)',
    darkText: '#38BDF8',
    accentColor: '#38BDF8',
    icon: 'hardware-chip-outline',
  },
  'Sports': {
    bg: '#FFFBEB',
    text: '#D97706',
    darkBg: 'rgba(245, 158, 11, 0.15)',
    darkText: '#FBBF24',
    accentColor: '#F59E0B',
    icon: 'football-outline',
  },
  'World': {
    bg: '#EEF2FF',
    text: '#4F46E5',
    darkBg: 'rgba(99, 102, 241, 0.15)',
    darkText: '#818CF8',
    accentColor: '#6366F1',
    icon: 'globe-outline',
  },
  'Health': {
    bg: '#F0FDFA',
    text: '#0D9488',
    darkBg: 'rgba(20, 184, 166, 0.15)',
    darkText: '#2DD4BF',
    accentColor: '#14B8A6',
    icon: 'fitness-outline',
  },
  'Entertainment': {
    bg: '#FDF2F8',
    text: '#DB2777',
    darkBg: 'rgba(236, 72, 153, 0.15)',
    darkText: '#F472B6',
    accentColor: '#EC4899',
    icon: 'film-outline',
  },
  'Education': {
    bg: '#F0F9FF',
    text: '#0284C7',
    darkBg: 'rgba(14, 165, 233, 0.15)',
    darkText: '#38BDF8',
    accentColor: '#0EA5E9',
    icon: 'school-outline',
  },
  'Environment & Climate': {
    bg: '#F7FEE7',
    text: '#65A30D',
    darkBg: 'rgba(132, 204, 22, 0.15)',
    darkText: '#A3E635',
    accentColor: '#84CC16',
    icon: 'leaf-outline',
  },
  'Environment': {
    bg: '#F7FEE7',
    text: '#65A30D',
    darkBg: 'rgba(132, 204, 22, 0.15)',
    darkText: '#A3E635',
    accentColor: '#84CC16',
    icon: 'leaf-outline',
  },
  'Science': {
    bg: '#FAF5FF',
    text: '#9333EA',
    darkBg: 'rgba(139, 92, 246, 0.15)',
    darkText: '#A78BFA',
    accentColor: '#8B5CF6',
    icon: 'flask-outline',
  },
  'Breaking': {
    bg: '#FEF2F2',
    text: '#B91C1C',
    darkBg: 'rgba(239, 68, 68, 0.2)',
    darkText: '#FCA5A5',
    accentColor: '#EF4444',
    icon: 'flash-outline',
  },
};
