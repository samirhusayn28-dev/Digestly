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
import { getCategoryFallbackUri } from '../../utils/imageHelper';

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
            <Image
              source={{
                uri: !imageError && article.imageUrl
                  ? article.imageUrl
                  : getCategoryFallbackUri(article.category, article.id),
              }}
              style={styles.heroImage}
              contentFit="cover"
              transition={250}
              onError={() => setImageError(true)}
            />

            {/* Gradient-like dark tint for legibility */}
            <View style={styles.heroGradientOverlay} />

            {/* Floating Top Badges */}
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadgeGroup}>
                <View style={styles.liveCoveragePill}>
                  <View style={styles.liveRedDot} />
                  <Text style={styles.liveCoverageText}>LIVE COVERAGE</Text>
                </View>

                <View style={styles.locationPill}>
                  <Ionicons name="location-sharp" size={11} color="#CBD5E1" style={{ marginRight: 3 }} />
                  <Text style={styles.locationText}>Karachi</Text>
                </View>
              </View>

              <View style={styles.heroActionBtnsGroup}>
                <TouchableOpacity
                  onPress={onPress}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.heroCircleActionBtn}
                >
                  <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleBookmark}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.heroCircleActionBtn}
                >
                  <Animated.View style={animatedBookmarkStyle}>
                    <Ionicons
                      name={isSaved ? 'bookmark' : 'bookmark-outline'}
                      size={15}
                      color="#FFFFFF"
                    />
                  </Animated.View>
                </TouchableOpacity>
              </View>
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

            {/* Paragraph / editorial summary */}
            <Text
              numberOfLines={3}
              style={[
                typography.body,
                styles.heroParagraph,
                { color: colors.textSecondary },
                newsLanguage === 'ur' && { textAlign: 'right' },
              ]}
            >
              {article.paragraphSummary || translatedSummary.join(' ')}
            </Text>
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
    gap: 6,
  },
  liveCoveragePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 5,
  },
  liveCoverageText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  locationText: {
    fontSize: 10,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  heroActionBtnsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroCircleActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
    marginBottom: 6,
  },
  heroParagraph: {
    fontSize: 13,
    lineHeight: 18,
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
