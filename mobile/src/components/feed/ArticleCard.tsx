import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Article } from '../../navigation/types';
import { useTheme } from '../../theme';
import { useAppStore } from '../../store/useAppStore';

interface ArticleCardProps {
  article: Article;
  onPress: () => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onPress }) => {
  const { width } = useWindowDimensions();
  const { colors, typography, categoryColors, isDark } = useTheme();
  const bookmarkedIds = useAppStore((state) => state.bookmarkedIds);
  const toggleBookmark = useAppStore((state) => state.toggleBookmark);

  const isSaved = bookmarkedIds.includes(article.id);
  const isTablet = width >= 768;

  // Micro-interaction: spring scale on press
  const cardScale = useSharedValue(1);

  const handlePressIn = () => {
    cardScale.value = withSpring(0.985, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const handleToggleBookmark = (e: any) => {
    e.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleBookmark(article.id);
  };

  const catStyle = categoryColors[article.category] || {
    bg: colors.surfaceSubtle,
    text: colors.accent,
    darkBg: '#1E293B',
    darkText: colors.accent,
  };

  return (
    <Animated.View style={animatedCardStyle}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: colors.cardShadow,
            maxWidth: isTablet ? 720 : '100%',
            alignSelf: 'center',
            width: '100%',
          },
        ]}
      >
        {/* Card Header: Category + Source + Breaking + Bookmark */}
        <View style={styles.headerRow}>
          <View style={styles.metaLeft}>
            {/* Breaking news pill */}
            {article.isBreaking && (
              <View style={[styles.breakingBadge, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="flame" size={12} color="#DC2626" style={{ marginRight: 3 }} />
                <Text style={[typography.badge, { color: '#DC2626', fontSize: 10 }]}>BREAKING</Text>
              </View>
            )}

            {/* Category Chip */}
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: isDark ? catStyle.darkBg : catStyle.bg },
              ]}
            >
              <Text
                style={[
                  typography.badge,
                  { color: isDark ? catStyle.darkText : catStyle.text, fontSize: 10.5 },
                ]}
              >
                {article.category}
              </Text>
            </View>

            <Text style={[typography.caption, { color: colors.textTertiary, marginHorizontal: 6 }]}>
              •
            </Text>

            {/* Source Name */}
            <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '700' }]}>
              {article.sourceName}
            </Text>

            <Text style={[typography.caption, { color: colors.textTertiary, marginHorizontal: 6 }]}>
              •
            </Text>

            {/* Timestamp */}
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {article.publishedAt}
            </Text>
          </View>

          {/* Bookmark Action - minimum 44x44 tap target */}
          <TouchableOpacity
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={handleToggleBookmark}
            style={styles.bookmarkTouch}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={21}
              color={isSaved ? colors.accent : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>

        {/* Main Content: Headline + Thumbnail */}
        <View style={styles.contentRow}>
          <Text style={[typography.h2, styles.headline, { color: colors.textPrimary }]}>
            {article.title}
          </Text>

          {article.imageUrl && (
            <Image
              source={{ uri: article.imageUrl }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={300}
            />
          )}
        </View>

        {/* AI 3-Line Summary Card */}
        <View
          style={[
            styles.summaryContainer,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight },
          ]}
        >
          <View style={styles.summaryBadgeRow}>
            <Ionicons name="sparkles" size={13} color={colors.accent} />
            <Text style={[typography.badge, { color: colors.accent, marginLeft: 5, fontSize: 10 }]}>
              Groq AI 3-Line Summary
            </Text>
          </View>

          {article.summary.slice(0, 3).map((bullet, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={[styles.bulletDot, { color: colors.accent }]}>•</Text>
              <Text style={[typography.summaryLine, { color: colors.textSecondary, flex: 1 }]}>
                {bullet}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer: Multi-Source count + Read trigger */}
        <View style={styles.footerRow}>
          {article.relatedSources && article.relatedSources.length > 0 ? (
            <View style={[styles.perspectivesPill, { backgroundColor: colors.accentSubtle }]}>
              <Ionicons name="git-network-outline" size={13} color={colors.accent} />
              <Text style={[typography.caption, { color: colors.accent, marginLeft: 5, fontWeight: '600' }]}>
                {article.relatedSources.length + 1} sources covering this
              </Text>
            </View>
          ) : (
            <View />
          )}

          <View style={styles.readMoreRow}>
            <Text style={[typography.caption, { color: colors.textTertiary, marginRight: 2 }]}>
              Read Story
            </Text>
            <Ionicons name="chevron-forward" size={13} color={colors.textTertiary} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    marginRight: 8,
  },
  breakingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bookmarkTouch: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  headline: {
    flex: 1,
    lineHeight: 26,
  },
  thumbnail: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  summaryContainer: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 6,
    marginBottom: 12,
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletDot: {
    fontSize: 16,
    lineHeight: 19,
    marginRight: 6,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  perspectivesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
