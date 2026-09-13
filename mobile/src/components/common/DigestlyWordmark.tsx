import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../../theme';

interface DigestlyWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  style?: TextStyle;
}

export const DigestlyWordmark: React.FC<DigestlyWordmarkProps> = ({
  size = 'md',
  color,
  style,
}) => {
  const { colors } = useTheme();

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 16;
      case 'md':
        return 20;
      case 'lg':
        return 25;
      case 'xl':
        return 34;
      default:
        return 20;
    }
  };

  const fontSize = getFontSize();

  return (
    <Text
      style={[
        styles.wordmark,
        {
          fontSize,
          color: color || colors.textPrimary,
          letterSpacing: -0.8,
        },
        style,
      ]}
    >
      Digestly
    </Text>
  );
};

const styles = StyleSheet.create({
  wordmark: {
    fontFamily: 'PlayfairDisplay_800ExtraBold',
    fontWeight: '800',
  },
});
