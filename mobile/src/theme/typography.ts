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
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.6,
  },
  h1: {
    fontFamily: fontFamilies.headingBold,
    fontSize: 21,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  h2: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  h4: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 14,
    lineHeight: 19,
  },
  bodyLarge: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 15,
    lineHeight: 23,
  },
  body: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13.5,
    lineHeight: 20,
  },
  bodyMedium: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13.5,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    lineHeight: 17,
  },
  caption: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.1,
  },
  badge: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 10.5,
    lineHeight: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  summaryLine: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13,
    lineHeight: 19,
  },
};
