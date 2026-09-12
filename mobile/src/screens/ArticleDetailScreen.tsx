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
  const [imageError, setImageError] = useState(false);

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
          }
        })
        .finally(() => {
          if (isMounted) setIsTranslating(false);
        });
    } else {
      setTranslatedTitle(article.title);
      setTranslatedSummary(article.summary);
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
    toggleBookmark(article.id);
  };

  const handleShare = async () => {
    Haptics.selectionAsync();
    try {
      await Share.share({
        title: article.title,
        message: `${article.title}\n\nRead the summary on Digestly:\n${article.sourceUrl}`,
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
        return 14.5;
    }
  };

  const getBodyLineHeight = () => {
    switch (fontSize) {
      case 'sm':
        return 21;
      case 'lg':
        return 26;
      case 'md':
      default:
        return 23;
    }
  };

  const catStyle = categoryColors[article.category] || categoryColors['Top Stories'] || {
    bg: colors.surfaceSubtle,
    text: colors.accent,
    darkBg: '#1E293B',
    darkText: colors.accent,
    accentColor: colors.accent,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Reading Progress Indicator Bar */}
      <View style={[styles.progressBarTrack, { backgroundColor: colors.borderLight }]}>
        <View
          style={[
            styles.progressBarFill,
            { backgroundColor: colors.accent, width: `${scrollProgress * 100}%` },
          ]}
        />
      </View>

      {/* Navigation Top Bar */}
      <View style={[styles.navBar, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.navBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight }]}
        >
          <Ionicons name="arrow-back" size={19} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.navRight}>
          {/* Language Urdu/English switch button */}
          <TouchableOpacity
            onPress={handleToggleLanguage}
            style={[
              styles.langToggleBtn,
              {
                backgroundColor: isUrdu ? colors.accent : colors.surfaceSubtle,
                borderColor: isUrdu ? colors.accent : colors.borderLight,
              },
            ]}
          >
            {isTranslating ? (
              <ActivityIndicator size="small" color={isUrdu ? (isDark ? '#000000' : '#FFFFFF') : colors.accent} />
            ) : (
              <Text
                style={[
                  typography.badge,
                  {
                    color: isUrdu ? (isDark ? '#000000' : '#FFFFFF') : colors.textPrimary,
                    fontSize: 10.5,
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

          <TouchableOpacity
            onPress={handleShare}
            style={[styles.navBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight }]}
          >
            <Ionicons name="share-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleBookmark}
            style={[styles.navBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight }]}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isSaved ? colors.accent : colors.textPrimary}
            />
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
        {/* Hero Image if available */}
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

        {/* 3-Line Summary Card */}
        <View
          style={[
            styles.aiSummaryBox,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight },
          ]}
        >
          <View style={styles.aiBadgeRow}>
            <View style={[styles.sparkleBox, { backgroundColor: colors.surface }]}>
              <Ionicons name="sparkles" size={14} color={colors.accent} />
            </View>
            <View style={{ flex: 1, marginLeft: 9 }}>
              <Text style={[typography.badge, { color: colors.accent, fontSize: 10.5 }]}>
                3-Line Digest
              </Text>
              <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 1 }]}>
                Distilled from Pakistani newsroom coverage
              </Text>
            </View>
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
                    backgroundColor: colors.surface,
                    marginRight: isUrdu ? 0 : 9,
                    marginLeft: isUrdu ? 9 : 0,
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
                    color: colors.textPrimary,
                    fontSize: getBodyFontSize(),
                    lineHeight: getBodyLineHeight(),
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
            Read full article on {article.sourceName}
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
    height: 2.5,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  langToggleBtn: {
    paddingHorizontal: 8,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minWidth: 38,
  },
  fontToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  heroContainer: {
    width: '100%',
    height: 200,
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
  aiSummaryBox: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sparkleBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
