import { TextStyle, Platform } from 'react-native';

// iOS System Font (San Francisco / SF Pro) on iOS, native system sans-serif on Android
const systemFont = Platform.select({
  ios: 'System',
  default: 'sans-serif',
});

export const fontFamilies = {
  headingRegular: systemFont,
  headingSemiBold: systemFont,
  headingBold: systemFont,
  bodyRegular: systemFont,
  bodyMedium: systemFont,
  bodySemiBold: systemFont,
  bodyBold: systemFont,
};

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: fontFamilies.headingBold,
    fontWeight: '800',
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.6,
  },
  h1: {
    fontFamily: fontFamilies.headingBold,
    fontWeight: '700',
    fontSize: 21,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  h2: {
    fontFamily: fontFamilies.headingSemiBold,
    fontWeight: '600',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: fontFamilies.headingSemiBold,
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  h4: {
    fontFamily: fontFamilies.headingSemiBold,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 19,
  },
  bodyLarge: {
    fontFamily: fontFamilies.bodyRegular,
    fontWeight: '400',
    fontSize: 15,
    lineHeight: 23,
  },
  body: {
    fontFamily: fontFamilies.bodyRegular,
    fontWeight: '400',
    fontSize: 13.5,
    lineHeight: 20,
  },
  bodyMedium: {
    fontFamily: fontFamilies.bodyMedium,
    fontWeight: '500',
    fontSize: 13.5,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: fontFamilies.bodyRegular,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 17,
  },
  caption: {
    fontFamily: fontFamilies.bodyMedium,
    fontWeight: '500',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.1,
  },
  badge: {
    fontFamily: fontFamilies.bodySemiBold,
    fontWeight: '700',
    fontSize: 10.5,
    lineHeight: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: fontFamilies.bodySemiBold,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  summaryLine: {
    fontFamily: fontFamilies.bodyRegular,
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 19,
  },
};
