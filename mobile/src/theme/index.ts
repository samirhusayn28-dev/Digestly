import { darkColors, categoryColors, ThemeColors } from './colors';
import { typography, fontFamilies } from './typography';
import { spacing, borderRadius } from './spacing';

export function useTheme() {
  // Permanently use refined Dark Theme
  const isDark = true;
  const colors: ThemeColors = darkColors;

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
