import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

interface ReturningUserLoaderProps {
  onFinish?: () => void;
  accentColorChoice?: 'blue' | 'yellow' | 'red';
}

export const ReturningUserLoader: React.FC<ReturningUserLoaderProps> = ({
  onFinish,
  accentColorChoice = 'blue',
}) => {
  const { colors, isDark } = useTheme();

  // Progress of text fill from 0 to 1
  const fillProgress = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  // Pick tasteful accent color
  const accentColor =
    accentColorChoice === 'blue'
      ? isDark
        ? '#60A5FA'
        : '#2563EB'
      : accentColorChoice === 'yellow'
      ? isDark
        ? '#FBBF24'
        : '#D97706'
      : isDark
      ? '#F87171'
      : '#DC2626';

  const neutralColor = isDark ? '#334155' : '#CBD5E1';

  useEffect(() => {
    // Progressive text-fill animation traveling smoothly across "Digestly"
    fillProgress.value = withTiming(
      1,
      {
        duration: 900,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
      (finished) => {
        if (finished) {
          // Smooth fade and reveal
          containerOpacity.value = withSequence(
            withTiming(0, { duration: 350, easing: Easing.out(Easing.ease) }, () => {
              if (onFinish) {
                runOnJS(onFinish)();
              }
            })
          );
        }
      }
    );
  }, [fillProgress, containerOpacity, onFinish]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${fillProgress.value * 100}%`,
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.backdrop,
        {
          backgroundColor: isDark ? 'rgba(11, 14, 20, 0.94)' : 'rgba(255, 255, 255, 0.94)',
        },
        animatedContainerStyle,
      ]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        {/* Underneath neutral text */}
        <View style={styles.textStack}>
          <Text style={[styles.wordmark, { color: neutralColor }]}>Digestly</Text>

          {/* Overlaid progressively filled text with animated width */}
          <Animated.View style={[styles.fillMask, animatedFillStyle]}>
            <Text style={[styles.wordmark, { color: accentColor }]}>Digestly</Text>
          </Animated.View>
        </View>

        {/* Minimal subtitle */}
        <Text style={[styles.subText, { color: colors.textTertiary }]}>
          Updating your radar...
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStack: {
    position: 'relative',
    height: 48,
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: 'Sora_700Bold',
    fontSize: 34,
    letterSpacing: -1,
    fontWeight: '800',
  },
  fillMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  subText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.3,
    marginTop: 12,
  },
});
