import { TextStyle } from 'react-native';

export const fontFamilies = {
  headingRegular: 'Sora_400Regular',
  headingSemiBold: 'Sora_600SemiBold',
  headingBold: 'Sora_700Bold',
  bodyRegular: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
};

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: fontFamilies.headingBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: fontFamilies.headingBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 17,
    lineHeight: 24,
  },
  h4: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 15,
    lineHeight: 21,
  },
  bodyLarge: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 14,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 14,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  badge: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  summaryLine: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13.5,
    lineHeight: 20,
  },
};
