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
  accentBlue: '#E2E8F0',
  accentRed: '#EF4444',
  accentYellow: '#854D0E', // Dark mode highlighter tone
  border: '#1E2536',
  borderLight: '#161C2A',
  tabBarBackground: '#0B0E14',
  tabBarBorder: '#1E2536',
  tabBarActive: '#F8FAFC',
  tabBarInactive: '#64748B',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
  statusBarStyle: 'light-content',
};

// Muted Editorial Palette: Quiet, desaturated neutral tones (FT, The Economist, Apple News)
// Replaces saturated rainbow pills with clean slate/neutral badge styling
const neutralTag = {
  bg: '#F1F5F9',
  text: '#334155',
  darkBg: '#1E293B',
  darkText: '#CBD5E1',
  accentColor: '#0F172A',
};

export const categoryColors: Record<
  string,
  { bg: string; text: string; darkBg: string; darkText: string; accentColor: string }
> = {
  'Top Stories': {
    bg: '#0F172A',
    text: '#FFFFFF',
    darkBg: '#F8FAFC',
    darkText: '#0F172A',
    accentColor: '#0F172A',
  },
  Politics: neutralTag,
  Business: neutralTag,
  Finance: neutralTag,
  Tech: neutralTag,
  Technology: neutralTag,
  AI: neutralTag,
  Sports: neutralTag,
  World: neutralTag,
  Entertainment: neutralTag,
  Science: neutralTag,
  Health: neutralTag,
  Lifestyle: neutralTag,
  Education: neutralTag,
  Environment: neutralTag,
  Travel: neutralTag,
  Food: neutralTag,
  Culture: neutralTag,
  Gaming: neutralTag,
  Automotive: neutralTag,
  Breaking: {
    bg: '#FEF2F2',
    text: '#B91C1C',
    darkBg: 'rgba(185, 28, 28, 0.25)',
    darkText: '#FCA5A5',
    accentColor: '#DC2626',
  },
};
