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
  const { colors } = useTheme();

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
      <View style={styles.topMetaRow}>
        <Skeleton width={70} height={20} borderRadius={6} />
        <Skeleton width={80} height={16} borderRadius={4} />
        <View style={{ flex: 1 }} />
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>

      <View style={styles.headlineRow}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Skeleton width="100%" height={20} borderRadius={6} style={{ marginBottom: 8 }} />
          <Skeleton width="85%" height={20} borderRadius={6} />
        </View>
        <Skeleton width={72} height={72} borderRadius={12} />
      </View>

      <View
        style={[
          styles.summaryBox,
          { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight },
        ]}
      >
        <Skeleton width={90} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="96%" height={12} borderRadius={4} style={{ marginBottom: 6 }} />
        <Skeleton width="90%" height={12} borderRadius={4} />
      </View>

      <View style={styles.footerRow}>
        <Skeleton width={110} height={14} borderRadius={4} />
        <Skeleton width={80} height={14} borderRadius={4} />
      </View>
    </View>
  );
};

export const FeedSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.screenSkeletonContainer}>
      {/* Category Pills Row */}
      <View style={styles.pillsRow}>
        <Skeleton width={60} height={32} borderRadius={16} />
        <Skeleton width={75} height={32} borderRadius={16} />
        <Skeleton width={90} height={32} borderRadius={16} />
        <Skeleton width={70} height={32} borderRadius={16} />
      </View>

      {/* Hero Card Skeleton */}
      <View
        style={[
          styles.heroCardSkeleton,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Skeleton width="100%" height={170} borderRadius={14} style={{ marginBottom: 14 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
          <Skeleton width={90} height={22} borderRadius={11} />
          <Skeleton width={100} height={16} borderRadius={4} />
        </View>
        <Skeleton width="95%" height={22} borderRadius={6} style={{ marginBottom: 8 }} />
        <Skeleton width="75%" height={22} borderRadius={6} style={{ marginBottom: 14 }} />
        <Skeleton width="100%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <Skeleton width="88%" height={14} borderRadius={4} />
      </View>

      {/* Highlights Row Skeleton */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <Skeleton width="31%" height={110} borderRadius={14} />
        <Skeleton width="31%" height={110} borderRadius={14} />
        <Skeleton width="31%" height={110} borderRadius={14} />
      </View>

      {/* Article Row Skeleton */}
      <ArticleCardSkeleton />
    </View>
  );
};

export const DiscoverSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.screenSkeletonContainer}>
      {/* Search Bar Skeleton */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <Skeleton width="82%" height={46} borderRadius={14} />
        <Skeleton width={46} height={46} borderRadius={14} />
      </View>

      {/* Category Icons Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={{ alignItems: 'center', gap: 6 }}>
            <Skeleton width={46} height={46} borderRadius={23} />
            <Skeleton width={40} height={10} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* Split Highlights Section */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <Skeleton width="48%" height={150} borderRadius={16} />
        <Skeleton width="48%" height={150} borderRadius={16} />
      </View>

      {/* Trending Topics Rows */}
      <Skeleton width={140} height={20} borderRadius={6} style={{ marginBottom: 14 }} />
      <Skeleton width="100%" height={64} borderRadius={14} style={{ marginBottom: 10 }} />
      <Skeleton width="100%" height={64} borderRadius={14} />
    </View>
  );
};

export const BookmarksSkeleton: React.FC = () => {
  return (
    <View style={styles.screenSkeletonContainer}>
      {/* Category Pills */}
      <View style={[styles.pillsRow, { marginBottom: 16 }]}>
        <Skeleton width={50} height={30} borderRadius={15} />
        <Skeleton width={75} height={30} borderRadius={15} />
        <Skeleton width={70} height={30} borderRadius={15} />
        <Skeleton width={65} height={30} borderRadius={15} />
      </View>

      {/* Info Banner */}
      <Skeleton width="100%" height={56} borderRadius={14} style={{ marginBottom: 16 }} />

      {/* Bookmark Cards */}
      <ArticleCardSkeleton />
      <ArticleCardSkeleton />
    </View>
  );
};

export const ArticleDetailSkeleton: React.FC = () => {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Hero Image */}
      <Skeleton width="100%" height={240} borderRadius={20} style={{ marginBottom: 18 }} />

      {/* Source Row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 }}>
        <Skeleton width={36} height={36} borderRadius={18} />
        <View style={{ flex: 1 }}>
          <Skeleton width={110} height={16} borderRadius={4} style={{ marginBottom: 4 }} />
          <Skeleton width={70} height={12} borderRadius={4} />
        </View>
        <Skeleton width={70} height={32} borderRadius={16} />
      </View>

      {/* Title */}
      <Skeleton width="100%" height={26} borderRadius={6} style={{ marginBottom: 8 }} />
      <Skeleton width="85%" height={26} borderRadius={6} style={{ marginBottom: 18 }} />

      {/* Audio waveform card */}
      <Skeleton width="100%" height={68} borderRadius={16} style={{ marginBottom: 20 }} />

      {/* Editorial brief */}
      <Skeleton width="100%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
      <Skeleton width="96%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
      <Skeleton width="92%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
      <Skeleton width="70%" height={14} borderRadius={4} />
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
  screenSkeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  heroCardSkeleton: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
});
