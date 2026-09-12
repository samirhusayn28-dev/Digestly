import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Share,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;

type FontSizeOption = 'sm' | 'md' | 'lg';

export const ArticleDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { article } = route.params;
  const { width } = useWindowDimensions();
  const { colors, typography, categoryColors, isDark } = useTheme();
  const bookmarkedIds = useAppStore((state) => state.bookmarkedIds);
  const toggleBookmark = useAppStore((state) => state.toggleBookmark);

  const [fontSize, setFontSize] = useState<FontSizeOption>('md');
  const [scrollProgress, setScrollProgress] = useState(0);

  const isSaved = bookmarkedIds.includes(article.id);
  const isTablet = width >= 768;

  const handleOpenSource = async (url: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: isDark ? '#131B29' : '#FFFFFF',
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
        message: `${article.title}\n\nRead the AI-distilled summary on Digestly:\n${article.sourceUrl}`,
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
        return 14;
      case 'lg':
        return 17.5;
      case 'md':
      default:
        return 15.5;
    }
  };

  const getBodyLineHeight = () => {
    switch (fontSize) {
      case 'sm':
        return 22;
      case 'lg':
        return 27;
      case 'md':
      default:
        return 24;
    }
  };

  const catStyle = categoryColors[article.category] || {
    bg: colors.surfaceSubtle,
    text: colors.accent,
    darkBg: '#1E293B',
    darkText: colors.accent,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
          style={[styles.navBtn, { backgroundColor: colors.surfaceSubtle }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.navRight}>
          {/* Font Size Toggle Button */}
          <TouchableOpacity
            onPress={cycleFontSize}
            style={[styles.navBtn, { backgroundColor: colors.surfaceSubtle, marginRight: 8 }]}
          >
            <Text style={[styles.fontToggleText, { color: colors.textPrimary }]}>
              {fontSize === 'sm' ? 'A' : fontSize === 'md' ? 'A+' : 'A++'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            style={[styles.navBtn, { backgroundColor: colors.surfaceSubtle, marginRight: 8 }]}
          >
            <Ionicons name="share-outline" size={19} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleBookmark}
            style={[styles.navBtn, { backgroundColor: colors.surfaceSubtle }]}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? colors.accent : colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { maxWidth: isTablet ? 740 : '100%', alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Hero Image if available */}
        {article.imageUrl && (
          <View style={styles.heroContainer}>
            <Image
              source={{ uri: article.imageUrl }}
              style={styles.heroImage}
              contentFit="cover"
              transition={400}
            />
          </View>
        )}

        {/* Category & Source Metadata */}
        <View style={styles.metaRow}>
          {article.isBreaking && (
            <View style={[styles.breakingBadge, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="flame" size={12} color="#DC2626" style={{ marginRight: 3 }} />
              <Text style={[typography.badge, { color: '#DC2626', fontSize: 10 }]}>BREAKING</Text>
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
                { color: isDark ? catStyle.darkText : catStyle.text, fontSize: 10.5 },
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
        <Text style={[typography.h1, styles.title, { color: colors.textPrimary }]}>
          {article.title}
        </Text>

        {/* Groq AI 3-Line Summary Card */}
        <View
          style={[
            styles.aiSummaryBox,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.aiBadgeRow}>
            <View style={[styles.sparkleBox, { backgroundColor: colors.accentSubtle }]}>
              <Ionicons name="sparkles" size={16} color={colors.accent} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[typography.badge, { color: colors.accent }]}>
                Groq AI 3-Line Distillation
              </Text>
              <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 1 }]}>
                Synthesized facts from Pakistani newsroom coverage
              </Text>
            </View>
          </View>

          {article.summary.map((point, index) => (
            <View key={index} style={styles.bulletRow}>
              <View style={[styles.bulletNumberCircle, { backgroundColor: colors.accentSubtle }]}>
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
          <Ionicons name="newspaper-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={[typography.button, { color: '#FFFFFF' }]}>
            Read full article on {article.sourceName}
          </Text>
          <Ionicons name="open-outline" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        {/* Multi-Source Comparison Feature (Differentiator) */}
        {article.relatedSources && article.relatedSources.length > 0 && (
          <View style={styles.comparisonSection}>
            <View style={styles.comparisonHeader}>
              <View style={[styles.compareIconBox, { backgroundColor: colors.accentSubtle }]}>
                <Ionicons name="git-network" size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>
                  Other Sources Are Also Covering This
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  Cross-examine editorial framing across major Pakistani newsrooms:
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
                    <Text style={[typography.badge, { color: colors.accent }]}>
                      {rel.sourceName}
                    </Text>
                  </View>
                  <Ionicons name="open-outline" size={15} color={colors.textTertiary} />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBarTrack: {
    height: 3,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  navBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
  },
  heroContainer: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#E2E8F0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
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
  title: {
    marginBottom: 18,
    lineHeight: 34,
  },
  aiSummaryBox: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sparkleBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletNumberCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  bulletNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
  },
  readOriginalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 14,
    marginBottom: 28,
  },
  comparisonSection: {
    marginTop: 4,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  compareIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  relatedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  relatedSourceTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  relatedHeadline: {
    lineHeight: 22,
    marginBottom: 8,
  },
  angleBox: {
    padding: 10,
    borderRadius: 10,
  },
});
