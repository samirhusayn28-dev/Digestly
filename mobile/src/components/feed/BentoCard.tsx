import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
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

interface BentoCardProps {
  article: Article;
  variant?: 'hero' | 'secondary';
  onPress: () => void;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  article,
  variant = 'hero',
  onPress,
}) => {
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

  // Spring scale micro-interaction
  const cardScale = useSharedValue(1);
  const bookmarkScale = useSharedValue(1);

  const handlePressIn = () => {
    cardScale.value = withSpring(0.985, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const animatedBookmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
  }));

  // Handle translation when newsLanguage is Urdu
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

  const catStyle = categoryColors[article.category] || categoryColors['Top Stories'];

  // Handle bookmark
  const handleBookmark = (e: any) => {
    e.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bookmarkScale.value = withSequence(
      withTiming(1.35, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 350 })
    );
    toggleBookmark(article.id);
  };

  if (variant === 'hero') {
    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          activeOpacity={0.94}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.cardShadow,
            },
          ]}
        >
          {/* Image Container with overlay */}
          <View style={styles.heroImageWrap}>
            {!imageError && article.imageUrl ? (
              <Image
                source={{ uri: article.imageUrl }}
                style={styles.heroImage}
                contentFit="cover"
                transition={250}
                onError={() => setImageError(true)}
              />
            ) : (
              <View
                style={[
                  styles.heroImageFallback,
                  { backgroundColor: isDark ? '#1E2536' : '#E2E8F0' },
                ]}
              >
                <Ionicons name="newspaper-outline" size={32} color={colors.textTertiary} />
                <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>
                  {article.sourceName}
                </Text>
              </View>
            )}

            {/* Gradient-like dark tint for legibility */}
            <View style={styles.heroGradientOverlay} />

            {/* Floating Top Badges */}
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadgeGroup}>
                <View
                  style={[
                    styles.heroCategoryBadge,
                    { backgroundColor: isDark ? catStyle.darkBg : '#FFFFFF' },
                  ]}
                >
                  <Text
                    style={[
                      typography.badge,
                      { color: isDark ? catStyle.darkText : catStyle.accentColor, fontSize: 10 },
                    ]}
                  >
                    {article.category}
                  </Text>
                </View>

                {article.isBreaking && (
                  <View style={[styles.breakingBadge, { backgroundColor: '#DC2626' }]}>
                    <Ionicons name="flash" size={10} color="#FFFFFF" style={{ marginRight: 2 }} />
                    <Text style={[typography.badge, { color: '#FFFFFF', fontSize: 9 }]}>
                      BREAKING
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={handleBookmark}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.heroBookmarkBtn}
              >
                <Animated.View style={animatedBookmarkStyle}>
                  <Ionicons
                    name={isSaved ? 'bookmark' : 'bookmark-outline'}
                    size={18}
                    color="#FFFFFF"
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>

            {/* Floating Source Tag */}
            <View style={styles.heroSourceTag}>
              <Text style={styles.heroSourceText}>{article.sourceName}</Text>
              <Text style={styles.heroDot}>•</Text>
              <Text style={styles.heroTimeText}>{article.publishedAt}</Text>
            </View>
          </View>

          {/* Hero Content Body */}
          <View style={styles.heroBody}>
            <Text
              style={[
                typography.h2,
                styles.heroTitle,
                { color: colors.textPrimary },
                newsLanguage === 'ur' && { textAlign: 'right' },
              ]}
            >
              {translatedTitle}
            </Text>

            {/* 3-Line Summary Callout */}
            <View
              style={[
                styles.summaryBox,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderLeftColor: colors.accentBlue,
                },
              ]}
            >
              <View style={styles.summaryHeader}>
                <Ionicons name="sparkles" size={11} color={colors.accentBlue} />
                <Text
                  style={[
                    typography.caption,
                    { color: colors.accentBlue, fontWeight: '700', marginLeft: 4 },
                  ]}
                >
                  AI SUMMARY
                </Text>
              </View>

              {translatedSummary.slice(0, 2).map((line, idx) => (
                <View key={idx} style={styles.summaryBulletRow}>
                  <Text style={[styles.bulletDot, { color: colors.accentBlue }]}>▪</Text>
                  <Text
                    numberOfLines={2}
                    style={[
                      typography.bodySmall,
                      styles.bulletText,
                      { color: colors.textSecondary },
                      newsLanguage === 'ur' && { textAlign: 'right' },
                    ]}
                  >
                    {line}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Secondary Bento Card (Supporting Story)
  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.secCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: colors.cardShadow,
          },
        ]}
      >
        <View style={styles.secLeft}>
          <View style={styles.secMetaRow}>
            <View
              style={[
                styles.secCategoryBadge,
                { backgroundColor: isDark ? catStyle.darkBg : catStyle.bg },
              ]}
            >
              <Text
                style={[
                  typography.badge,
                  { color: isDark ? catStyle.darkText : catStyle.accentColor, fontSize: 9.5 },
                ]}
              >
                {article.category}
              </Text>
            </View>

            <Text style={[typography.caption, { color: colors.textTertiary, marginLeft: 6 }]}>
              {article.sourceName}
            </Text>
          </View>

          <Text
            numberOfLines={3}
            style={[
              typography.h4,
              styles.secTitle,
              { color: colors.textPrimary },
              newsLanguage === 'ur' && { textAlign: 'right' },
            ]}
          >
            {translatedTitle}
          </Text>

          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>
            {article.publishedAt}
          </Text>
        </View>

        <View style={styles.secRight}>
          {!imageError && article.imageUrl ? (
            <Image
              source={{ uri: article.imageUrl }}
              style={styles.secThumbnail}
              contentFit="cover"
              transition={200}
              onError={() => setImageError(true)}
            />
          ) : (
            <View
              style={[
                styles.secThumbnailFallback,
                { backgroundColor: isDark ? '#1E2536' : '#F1F5F9' },
              ]}
            >
              <Ionicons name="newspaper-outline" size={20} color={colors.textTertiary} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  heroImageWrap: {
    position: 'relative',
    height: 180,
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  heroTopRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  breakingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 6,
  },
  heroBookmarkBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSourceTag: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroSourceText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontFamily: 'Inter_600SemiBold',
  },
  heroDot: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 4,
    fontSize: 10,
  },
  heroTimeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  heroBody: {
    padding: 14,
  },
  heroTitle: {
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  summaryBox: {
    borderRadius: 8,
    borderLeftWidth: 2.5,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  bulletDot: {
    fontSize: 10,
    marginRight: 6,
    lineHeight: 16,
  },
  bulletText: {
    flex: 1,
    lineHeight: 17,
  },
  secCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  secLeft: {
    flex: 1,
    marginRight: 10,
  },
  secMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  secCategoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  secTitle: {
    fontSize: 13.5,
    lineHeight: 18,
  },
  secRight: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
  },
  secThumbnail: {
    width: '100%',
    height: '100%',
  },
  secThumbnailFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
