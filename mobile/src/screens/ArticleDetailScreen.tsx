import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Share,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { translateArticleContent } from '../services/translation';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;

type FontSizeOption = 'sm' | 'md' | 'lg';

export const ArticleDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { article } = route.params;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, typography, categoryColors, isDark } = useTheme();

  const newsLanguage = useAppStore((state) => state.newsLanguage);
  const setNewsLanguage = useAppStore((state) => state.setNewsLanguage);
  const bookmarkedIds = useAppStore((state) => state.bookmarkedIds);
  const toggleBookmark = useAppStore((state) => state.toggleBookmark);

  const [fontSize, setFontSize] = useState<FontSizeOption>('md');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState(article.title);
  const [translatedSummary, setTranslatedSummary] = useState(article.summary);
  const [translatedParagraph, setTranslatedParagraph] = useState(
    article.paragraphSummary || (Array.isArray(article.summary) ? article.summary.join(' ') : article.title)
  );
  const [imageError, setImageError] = useState(false);

  // Micro-interaction: spring bounce on bookmark
  const bookmarkScale = useSharedValue(1);
  const animatedBookmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
  }));

  const isSaved = bookmarkedIds.includes(article.id);
  const isTablet = width >= 768;
  const isUrdu = newsLanguage === 'ur';

  // Translation synchronization
  useEffect(() => {
    let isMounted = true;
    if (newsLanguage === 'ur') {
      setIsTranslating(true);
      translateArticleContent(article, 'ur')
        .then((data) => {
          if (isMounted) {
            setTranslatedTitle(data.title);
            setTranslatedSummary(data.summary);
            if (data.paragraphSummary) {
              setTranslatedParagraph(data.paragraphSummary);
            }
          }
        })
        .finally(() => {
          if (isMounted) setIsTranslating(false);
        });
    } else {
      setTranslatedTitle(article.title);
      setTranslatedSummary(article.summary);
      setTranslatedParagraph(
        article.paragraphSummary || (Array.isArray(article.summary) ? article.summary.join(' ') : article.title)
      );
      setIsTranslating(false);
    }
    return () => {
      isMounted = false;
    };
  }, [article, newsLanguage]);

  const handleToggleLanguage = () => {
    Haptics.selectionAsync();
    setNewsLanguage(newsLanguage === 'en' ? 'ur' : 'en');
  };

  const handleOpenSource = async (url: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: isDark ? '#121620' : '#FFFFFF',
        controlsColor: colors.accent,
      });
    } catch (e) {
      console.warn('Unable to open in-app browser', e);
    }
  };

  const handleToggleBookmark = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    bookmarkScale.value = withSequence(
      withTiming(1.35, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 350 })
    );
    toggleBookmark(article.id);
  };

  const handleShare = async () => {
    Haptics.selectionAsync();
    try {
      await Share.share({
        title: article.title,
        message: `${article.title}\n\nRead the complete digest on Digestly:\n${article.sourceUrl}`,
        url: article.sourceUrl,
      });
    } catch (e) {
      console.warn('Share error', e);
    }
  };

  const cycleFontSize = () => {
    Haptics.selectionAsync();
    setFontSize((curr) => (curr === 'sm' ? 'md' : curr === 'md' ? 'lg' : 'sm'));
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const total = contentSize.height - layoutMeasurement.height;
    if (total > 0) {
      const prog = Math.min(Math.max(contentOffset.y / total, 0), 1);
      setScrollProgress(prog);
    }
  };

  const getBodyFontSize = () => {
    switch (fontSize) {
      case 'sm':
        return 13.5;
      case 'lg':
        return 16.5;
      case 'md':
      default:
        return 15;
    }
  };

  const getBodyLineHeight = () => {
    switch (fontSize) {
      case 'sm':
        return 21;
      case 'lg':
        return 27;
      case 'md':
      default:
        return 24;
    }
  };

  const catStyle = categoryColors[article.category] || categoryColors['Top Stories'] || {
    bg: colors.surfaceSubtle,
    text: colors.textPrimary,
    darkBg: '#1E293B',
    darkText: colors.textPrimary,
  };

  // Helper to render yellow marker highlighter text
  const renderHighlightedText = (
    text: string,
    highlights: string[] | undefined,
    textColor: string,
    fSize: number,
    lHeight: number,
    isUrduText: boolean
  ) => {
    if (!highlights || highlights.length === 0) {
      return (
        <Text
          style={{
            color: textColor,
            fontSize: fSize,
            lineHeight: lHeight,
            textAlign: isUrduText ? 'right' : 'left',
            writingDirection: isUrduText ? 'rtl' : 'ltr',
          }}
        >
          {text}
        </Text>
      );
    }

    const validHighlights = highlights
      .filter((h) => h && typeof h === 'string' && h.trim().length > 1)
      .map((h) => h.trim());

    if (validHighlights.length === 0) {
      return (
        <Text
          style={{
            color: textColor,
            fontSize: fSize,
            lineHeight: lHeight,
            textAlign: isUrduText ? 'right' : 'left',
            writingDirection: isUrduText ? 'rtl' : 'ltr',
          }}
        >
          {text}
        </Text>
      );
    }

    const escaped = validHighlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
      <Text
        style={{
          color: textColor,
          fontSize: fSize,
          lineHeight: lHeight,
          textAlign: isUrduText ? 'right' : 'left',
          writingDirection: isUrduText ? 'rtl' : 'ltr',
        }}
      >
        {parts.map((part, index) => {
          const isMatch = validHighlights.some((h) => h.toLowerCase() === part.toLowerCase());
          if (isMatch) {
            return (
              <Text
                key={index}
                style={{
                  backgroundColor: isDark ? 'rgba(234, 179, 8, 0.35)' : '#FEF08A',
                  color: isDark ? '#FEF08A' : '#713F12',
                  fontWeight: '700',
                }}
              >
                {part}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Progress Bar Header Indicator */}
      <View
        style={[
          styles.progressBarTrack,
          {
            top: insets.top,
            backgroundColor: colors.borderLight,
          },
        ]}
      >
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${scrollProgress * 100}%`,
              backgroundColor: colors.accent,
            },
          ]}
        />
      </View>

      {/* Sticky Editorial Top Bar */}
      <View
        style={[
          styles.navBar,
          {
            paddingTop: insets.top + 6,
            backgroundColor: colors.background,
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.backBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.navActions}>
          {/* Language Urdu / English Toggle */}
          <TouchableOpacity
            onPress={handleToggleLanguage}
            style={[
              styles.navBtn,
              {
                backgroundColor: isUrdu ? colors.accent : colors.surfaceSubtle,
                borderColor: colors.borderLight,
              },
            ]}
          >
            {isTranslating ? (
              <ActivityIndicator size="small" color={isUrdu ? (isDark ? '#000000' : '#FFFFFF') : colors.accent} />
            ) : (
              <Text
                style={[
                  typography.caption,
                  {
                    color: isUrdu ? (isDark ? '#000000' : '#FFFFFF') : colors.textPrimary,
                    fontSize: 10.5,
                    fontWeight: '700',
                  },
                ]}
              >
                {isUrdu ? 'اردو' : 'EN'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Font Size Toggle Button */}
          <TouchableOpacity
            onPress={cycleFontSize}
            style={[styles.navBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight }]}
          >
            <Text style={[styles.fontToggleText, { color: colors.textPrimary }]}>
              {fontSize === 'sm' ? 'A' : fontSize === 'md' ? 'A+' : 'A++'}
            </Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            onPress={handleShare}
            style={[styles.navBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight }]}
          >
            <Ionicons name="share-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Animated Bookmark Micro-interaction */}
          <TouchableOpacity
            onPress={handleToggleBookmark}
            style={[styles.navBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight }]}
          >
            <Animated.View style={animatedBookmarkStyle}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={isSaved ? colors.accent : colors.textPrimary}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            maxWidth: isTablet ? 740 : '100%',
            alignSelf: 'center',
            width: '100%',
            paddingBottom: insets.bottom + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Actual Article Image */}
        {!imageError && article.imageUrl ? (
          <View style={styles.heroContainer}>
            <Image
              source={{ uri: article.imageUrl }}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
              onError={() => setImageError(true)}
            />
          </View>
        ) : null}

        {/* Category & Source Metadata */}
        <View style={styles.metaRow}>
          {article.isBreaking && (
            <View style={[styles.breakingBadge, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="flash" size={10} color="#DC2626" style={{ marginRight: 3 }} />
              <Text style={[typography.badge, { color: '#DC2626', fontSize: 9.5 }]}>BREAKING</Text>
            </View>
          )}

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

          <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '700' }]}>
            {article.sourceName}
          </Text>

          <Text style={[typography.caption, { color: colors.textTertiary, marginHorizontal: 6 }]}>
            •
          </Text>

          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {article.publishedAt}
          </Text>
        </View>

        {/* Headline */}
        <Text
          style={[
            typography.h1,
            styles.title,
            {
              color: colors.textPrimary,
              textAlign: isUrdu ? 'right' : 'left',
              writingDirection: isUrdu ? 'rtl' : 'ltr',
            },
          ]}
        >
          {translatedTitle}
        </Text>

        {/* SECTION 1: Substantial Highlighted Paragraph (Editorial Prose Summary) */}
        <View
          style={[
            styles.editorialBox,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight },
          ]}
        >
          <View style={styles.editorialHeaderRow}>
            <View style={[styles.sparkleBox, { backgroundColor: colors.surface }]}>
              <Ionicons name="sparkles" size={14} color={colors.accent} />
            </View>
            <View style={{ flex: 1, marginLeft: 9 }}>
              <Text style={[typography.badge, { color: colors.accent, fontSize: 11 }]}>
                {isUrdu ? 'مکمل اداریاتی خلاصہ' : 'The Editorial Brief'}
              </Text>
              <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 1 }]}>
                {isUrdu
                  ? 'نمایاں حقائق اور نام زرد مارکر سے واضح کیے گئے ہیں'
                  : 'Key facts, entities, and numbers highlighted for rapid skim-reading'}
              </Text>
            </View>
          </View>

          <View style={styles.paragraphContainer}>
            {renderHighlightedText(
              translatedParagraph,
              article.highlightPhrases,
              colors.textPrimary,
              getBodyFontSize(),
              getBodyLineHeight(),
              isUrdu
            )}
          </View>
        </View>

        {/* SECTION 2: Key Points / Executive Takeaways */}
        <View
          style={[
            styles.keyPointsBox,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.keyPointsHeader}>
            <Ionicons name="list-outline" size={15} color={colors.textSecondary} />
            <Text style={[typography.h4, { color: colors.textPrimary, marginLeft: 6 }]}>
              {isUrdu ? 'اہم نکات' : 'Key Takeaways'}
            </Text>
          </View>

          {(translatedSummary || []).map((point, index) => (
            <View
              key={index}
              style={[
                styles.bulletRow,
                isUrdu && { flexDirection: 'row-reverse' },
              ]}
            >
              <View
                style={[
                  styles.bulletNumberCircle,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    marginRight: isUrdu ? 0 : 10,
                    marginLeft: isUrdu ? 10 : 0,
                  },
                ]}
              >
                <Text style={[styles.bulletNumber, { color: colors.accent }]}>
                  {index + 1}
                </Text>
              </View>
              <Text
                style={[
                  typography.bodyMedium,
                  styles.bulletText,
                  {
                    color: colors.textSecondary,
                    fontSize: getBodyFontSize() - 1,
                    lineHeight: getBodyLineHeight() - 2,
                    textAlign: isUrdu ? 'right' : 'left',
                    writingDirection: isUrdu ? 'rtl' : 'ltr',
                  },
                ]}
              >
                {point}
              </Text>
            </View>
          ))}
        </View>

        {/* Read Full Article on Source Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handleOpenSource(article.sourceUrl)}
          style={[styles.readOriginalButton, { backgroundColor: colors.accent }]}
        >
          <Ionicons
            name="newspaper-outline"
            size={16}
            color={isDark ? '#000000' : '#FFFFFF'}
            style={{ marginRight: 8 }}
          />
          <Text style={[typography.button, { color: isDark ? '#000000' : '#FFFFFF' }]}>
            Read full coverage on {article.sourceName}
          </Text>
          <Ionicons
            name="open-outline"
            size={15}
            color={isDark ? '#000000' : '#FFFFFF'}
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>

        {/* Multi-Source Comparison Feature */}
        {article.relatedSources && article.relatedSources.length > 0 && (
          <View style={styles.comparisonSection}>
            <View style={styles.comparisonHeader}>
              <View style={[styles.compareIconBox, { backgroundColor: colors.surfaceSubtle }]}>
                <Ionicons name="git-network-outline" size={16} color={colors.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>
                  Perspectives & Related Coverage
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  Examine framing across major Pakistani newsrooms:
                </Text>
              </View>
            </View>

            {article.relatedSources.map((rel, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.88}
                onPress={() => handleOpenSource(rel.sourceUrl)}
                style={[
                  styles.relatedCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.relatedTop}>
                  <View style={[styles.relatedSourceTag, { backgroundColor: colors.surfaceSubtle }]}>
                    <Text style={[typography.badge, { color: colors.accent, fontSize: 10 }]}>
                      {rel.sourceName}
                    </Text>
                  </View>
                  <Ionicons name="open-outline" size={14} color={colors.textTertiary} />
                </View>

                <Text style={[typography.h4, styles.relatedHeadline, { color: colors.textPrimary }]}>
                  {rel.headline}
                </Text>

                {rel.angleHighlight && (
                  <View style={[styles.angleBox, { backgroundColor: colors.surfaceSubtle }]}>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      <Text style={{ fontWeight: '700', color: colors.accent }}>Angle: </Text>
                      {rel.angleHighlight}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBarTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2.5,
    zIndex: 100,
  },
  progressBarFill: {
    height: '100%',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    zIndex: 90,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    height: 38,
    minWidth: 38,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fontToggleText: {
    fontWeight: '700',
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroContainer: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#E2E8F0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
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
  title: {
    marginBottom: 16,
    lineHeight: 28,
    fontSize: 20,
  },
  editorialBox: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  editorialHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paragraphContainer: {
    marginTop: 2,
  },
  sparkleBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPointsBox: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 18,
  },
  keyPointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bulletNumberCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bulletNumber: {
    fontSize: 11,
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
  },
  readOriginalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    marginBottom: 24,
  },
  comparisonSection: {
    marginTop: 2,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  compareIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  relatedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  relatedSourceTag: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  relatedHeadline: {
    lineHeight: 20,
    fontSize: 14,
    marginBottom: 6,
  },
  angleBox: {
    padding: 8,
    borderRadius: 8,
  },
});
