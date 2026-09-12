import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Article } from '../../navigation/types';
import { useTheme } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import { translateArticleContent } from '../../services/translation';

interface ArticleCardProps {
  article: Article;
  onPress: () => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onPress }) => {
  const { width } = useWindowDimensions();
  const { colors, typography, categoryColors, isDark } = useTheme();
  const newsLanguage = useAppStore((state) => state.newsLanguage);
  const bookmarkedIds = useAppStore((state) => state.bookmarkedIds);
  const toggleBookmark = useAppStore((state) => state.toggleBookmark);

  const [translatedTitle, setTranslatedTitle] = useState(article.title);
  const [translatedSummary, setTranslatedSummary] = useState(article.summary);
  const [imageError, setImageError] = useState(false);

  const isSaved = bookmarkedIds.includes(article.id);
  const isTablet = width >= 768;
  const isUrdu = newsLanguage === 'ur';

  // Translation hook
  useEffect(() => {
    let isMounted = true;
    if (newsLanguage === 'ur') {
      translateArticleContent(article, 'ur').then((data) => {
        if (isMounted) {
          setTranslatedTitle(data.title);
          setTranslatedSummary(data.summary);
        }
      });
    } else {
      setTranslatedTitle(article.title);
      setTranslatedSummary(article.summary);
    }
    return () => {
      isMounted = false;
    };
  }, [article, newsLanguage]);

  // Micro-interaction: spring scale on press
  const cardScale = useSharedValue(1);
  const bookmarkScale = useSharedValue(1);

  const handlePressIn = () => {
    cardScale.value = withSpring(0.985, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const animatedBookmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
  }));

  const handleToggleBookmark = (e: any) => {
    e.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bookmarkScale.value = withSequence(
      withTiming(1.35, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 350 })
    );
    toggleBookmark(article.id);
  };

  const catStyle = categoryColors[article.category] || categoryColors['Top Stories'] || {
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
                <Ionicons name="flash" size={10} color="#DC2626" style={{ marginRight: 3 }} />
                <Text style={[typography.badge, { color: '#DC2626', fontSize: 9.5 }]}>BREAKING</Text>
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
                  { color: isDark ? catStyle.darkText : catStyle.text, fontSize: 10 },
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
            <Animated.View style={animatedBookmarkStyle}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isSaved ? colors.accent : colors.textTertiary}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Main Content: Headline + Thumbnail */}
        <View style={styles.contentRow}>
          <Text
            style={[
              typography.h2,
              styles.headline,
              {
                color: colors.textPrimary,
                textAlign: isUrdu ? 'right' : 'left',
                writingDirection: isUrdu ? 'rtl' : 'ltr',
              },
            ]}
          >
            {translatedTitle}
          </Text>

          {/* Thumbnail / Image Fallback */}
          {!imageError && article.imageUrl ? (
            <Image
              source={{ uri: article.imageUrl }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
              onError={() => setImageError(true)}
            />
          ) : (
            <View
              style={[
                styles.thumbnailFallback,
                { backgroundColor: isDark ? '#1E2536' : '#F1F5F9', borderColor: colors.borderLight },
              ]}
            >
              <Ionicons name="newspaper-outline" size={24} color={colors.textTertiary} />
              <Text style={[styles.fallbackSource, { color: colors.textTertiary }]} numberOfLines={1}>
                {article.sourceName}
              </Text>
            </View>
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
            <Ionicons name="sparkles" size={12} color={colors.accent} />
            <Text style={[typography.badge, { color: colors.accent, marginLeft: 5, fontSize: 10 }]}>
              3-Line Digest
            </Text>
          </View>

          {(translatedSummary || []).slice(0, 3).map((bullet, idx) => (
            <View
              key={idx}
              style={[
                styles.bulletRow,
                isUrdu && { flexDirection: 'row-reverse' },
              ]}
            >
              <Text
                style={[
                  styles.bulletDot,
                  { color: colors.accent, marginRight: isUrdu ? 0 : 6, marginLeft: isUrdu ? 6 : 0 },
                ]}
              >
                •
              </Text>
              <Text
                style={[
                  typography.summaryLine,
                  {
                    color: colors.textSecondary,
                    flex: 1,
                    textAlign: isUrdu ? 'right' : 'left',
                    writingDirection: isUrdu ? 'rtl' : 'ltr',
                  },
                ]}
              >
                {bullet}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer: Multi-Source count + Read trigger */}
        <View style={styles.footerRow}>
          {article.relatedSources && article.relatedSources.length > 0 ? (
            <View style={[styles.perspectivesPill, { backgroundColor: colors.accentSubtle }]}>
              <Ionicons name="git-network-outline" size={12} color={colors.accent} />
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
    marginRight: 6,
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  bookmarkTouch: {
    width: 36,
    height: 36,
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
    lineHeight: 23,
    fontSize: 16,
    fontWeight: '700',
  },
  thumbnail: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  thumbnailFallback: {
    width: 76,
    height: 76,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    padding: 4,
  },
  fallbackSource: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  summaryContainer: {
    borderRadius: 12,
    padding: 11,
    borderWidth: 1,
    gap: 5,
    marginBottom: 10,
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletDot: {
    fontSize: 14,
    lineHeight: 18,
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
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
