import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface DigestlyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  inverted?: boolean;
}

export const DigestlyLogo: React.FC<DigestlyLogoProps> = ({ size = 'md', inverted = false }) => {
  const { isDark } = useTheme();

  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { boxSize: 24, fontSize: 13, radius: 7, border: 1.5 };
      case 'lg':
        return { boxSize: 44, fontSize: 24, radius: 13, border: 2 };
      case 'xl':
        return { boxSize: 72, fontSize: 38, radius: 22, border: 2.5 };
      case 'md':
      default:
        return { boxSize: 32, fontSize: 18, radius: 9.5, border: 1.8 };
    }
  };

  const dim = getDimensions();

  // Background and foreground color logic
  const bgColor = inverted
    ? isDark
      ? '#0F172A'
      : '#FFFFFF'
    : isDark
    ? '#F8FAFC'
    : '#0F172A';

  const textColor = inverted
    ? isDark
      ? '#FFFFFF'
      : '#0F172A'
    : isDark
    ? '#0B0E14'
    : '#FFFFFF';

  return (
    <View
      style={[
        styles.container,
        {
          width: dim.boxSize,
          height: dim.boxSize,
          borderRadius: dim.radius,
          backgroundColor: bgColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1.5 },
          shadowOpacity: isDark ? 0.25 : 0.12,
          shadowRadius: 3,
          elevation: 2,
        },
      ]}
    >
      <Text
        style={[
          styles.letterD,
          {
            fontSize: dim.fontSize,
            color: textColor,
            lineHeight: dim.fontSize + 2,
          },
        ]}
      >
        D
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterD: {
    fontFamily: 'Sora_700Bold',
    fontWeight: '800',
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
});
