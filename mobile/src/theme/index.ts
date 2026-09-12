import { useColorScheme } from 'react-native';
import { lightColors, darkColors, categoryColors, ThemeColors } from './colors';
import { typography, fontFamilies } from './typography';
import { spacing, borderRadius } from './spacing';
import { useAppStore } from '../store/useAppStore';

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const themeMode = useAppStore((state) => state.themeMode);

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  const colors: ThemeColors = isDark ? darkColors : lightColors;

  return {
    isDark,
    colors,
    categoryColors,
    typography,
    fontFamilies,
    spacing,
    borderRadius,
  };
}

export * from './colors';
export * from './typography';
export * from './spacing';
