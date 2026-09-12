import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

interface SkeletonProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height,
  borderRadius = 8,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.85, {
        duration: 900,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const baseColor = isDark ? '#1E293B' : '#E2E8F0';

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const ArticleCardSkeleton: React.FC = () => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Top Meta Row */}
      <View style={styles.topMetaRow}>
        <Skeleton width={70} height={20} borderRadius={6} />
        <Skeleton width={80} height={16} borderRadius={4} />
        <View style={{ flex: 1 }} />
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>

      {/* Headline & Thumbnail Row */}
      <View style={styles.headlineRow}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Skeleton width="100%" height={22} borderRadius={6} style={{ marginBottom: 8 }} />
          <Skeleton width="85%" height={22} borderRadius={6} />
        </View>
        <Skeleton width={72} height={72} borderRadius={12} />
      </View>

      {/* Summary Box */}
      <View
        style={[
          styles.summaryBox,
          { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight },
        ]}
      >
        <Skeleton width={90} height={14} borderRadius={4} style={{ marginBottom: 10 }} />
        <Skeleton width="96%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <Skeleton width="92%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <Skeleton width="75%" height={14} borderRadius={4} />
      </View>

      {/* Footer Meta */}
      <View style={styles.footerRow}>
        <Skeleton width={110} height={16} borderRadius={4} />
        <Skeleton width={80} height={16} borderRadius={4} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  headlineRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'center',
  },
  summaryBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
});
