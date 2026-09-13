import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
} from 'react-native-reanimated';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { translateArticleContent } from '../services/translation';
import { ArticleDetailSkeleton } from '../components/common/SkeletonLoader';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;

type FontSizeOption = 'sm' | 'md' | 'lg';

export const ArticleDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { article } = route.params;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, typography, categoryColors, isDark } = useTheme();

  const newsLanguage = useAppStore((state) => state.newsLanguage);
  const bookmarkedIds = useAppStore((state) => state.bookmarkedIds);
  const toggleBookmark = useAppStore((state) => state.toggleBookmark);

  const [fontSize, setFontSize] = useState<FontSizeOption>('md');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState(article.title);
  const [translatedSummary, setTranslatedSummary] = useState(article.summary || []);
  const [translatedParagraph, setTranslatedParagraph] = useState(
    article.paragraphSummary || (Array.isArray(article.summary) ? article.summary.join(' ') : article.title)
  );

  // Audio TTS state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(1.0);
  const [audioElapsedSeconds, setAudioElapsedSeconds] = useState(0);
  const audioTimerRef = useRef<any>(null);

  // Reanimated bookmark bounce
  const bookmarkScale = useSharedValue(1);
  const animatedBookmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
  }));

  // Waveform bar animation
  const waveAnim1 = useSharedValue(0.4);
  const waveAnim2 = useSharedValue(0.8);
  const waveAnim3 = useSharedValue(0.3);
  const waveAnim4 = useSharedValue(0.9);

  useEffect(() => {
    if (isPlayingAudio) {
      waveAnim1.value = withRepeat(withTiming(1, { duration: 350 }), -1, true);
      waveAnim2.value = withRepeat(withTiming(0.3, { duration: 420 }), -1, true);
      waveAnim3.value = withRepeat(withTiming(0.95, { duration: 380 }), -1, true);
      waveAnim4.value = withRepeat(withTiming(0.4, { duration: 450 }), -1, true);
    } else {
      waveAnim1.value = withTiming(0.4, { duration: 200 });
      waveAnim2.value = withTiming(0.8, { duration: 200 });
      waveAnim3.value = withTiming(0.3, { duration: 200 });
      waveAnim4.value = withTiming(0.9, { duration: 200 });
    }
  }, [isPlayingAudio]);

  const isSaved = bookmarkedIds.includes(article.id);
  const isTablet = width >= 768;
  const isUrdu = newsLanguage === 'ur';

  // Category styling
  const catTheme = categoryColors[article.category] || categoryColors['Top Stories'] || {
    bg: '#EFF6FF',
    text: '#2563EB',
    darkBg: 'rgba(56, 189, 248, 0.15)',
    darkText: '#38BDF8',
    accentColor: '#38BDF8',
  };

  // Location text inference
  const displayLocation = React.useMemo(() => {
    const text = (article.title + ' ' + (article.paragraphSummary || '')).toLowerCase();
    if (text.includes('peshawar')) return 'Peshawar, Pakistan';
    if (text.includes('islamabad')) return 'Islamabad, Pakistan';
    if (text.includes('karachi')) return 'Karachi, Pakistan';
    if (text.includes('lahore')) return 'Lahore, Pakistan';
    if (text.includes('quetta')) return 'Quetta, Pakistan';
    if (text.includes('gaza') || text.includes('middle east')) return 'Middle East';
    if (text.includes('washington') || text.includes('us ') || text.includes('biden')) return 'Washington, D.C.';
    if (text.includes('london') || text.includes('uk')) return 'London, UK';
    return 'Islamabad, Pakistan';
  }, [article]);

  // Read time calculation
  const readTimeMinutes = React.useMemo(() => {
    const totalWords = (article.title + ' ' + (article.paragraphSummary || '')).split(/\s+/).length;
    return Math.max(2, Math.ceil(totalWords / 45));
  }, [article]);

  // Sync translation
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
      setTranslatedSummary(article.summary || []);
      setTranslatedParagraph(
        article.paragraphSummary || (Array.isArray(article.summary) ? article.summary.join(' ') : article.title)
      );
      setIsTranslating(false);
    }
    return () => {
      isMounted = false;
    };
  }, [article, newsLanguage]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    };
  }, []);

  const handleToggleAudio = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isPlayingAudio) {
      await Speech.stop();
      setIsPlayingAudio(false);
      if (audioTimerRef.current) {
        clearInterval(audioTimerRef.current);
        audioTimerRef.current = null;
      }
    } else {
      const textToRead = `${translatedTitle}. ${translatedParagraph}`;
      setIsPlayingAudio(true);

      // Start duration ticker
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
      audioTimerRef.current = setInterval(() => {
        setAudioElapsedSeconds((prev) => prev + 1);
      }, 1000);

      Speech.speak(textToRead, {
        rate: audioSpeed,
        language: isUrdu ? 'ur' : 'en',
        onDone: () => {
          setIsPlayingAudio(false);
          setAudioElapsedSeconds(0);
          if (audioTimerRef.current) clearInterval(audioTimerRef.current);
        },
        onStopped: () => {
          setIsPlayingAudio(false);
          if (audioTimerRef.current) clearInterval(audioTimerRef.current);
        },
        onError: () => {
          setIsPlayingAudio(false);
          if (audioTimerRef.current) clearInterval(audioTimerRef.current);
        },
      });
    }
  };

  const cycleSpeed = () => {
    Haptics.selectionAsync();
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(audioSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setAudioSpeed(nextSpeed);

    if (isPlayingAudio) {
      Speech.stop();
      setIsPlayingAudio(false);
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    }
  };

  const handleOpenSource = async (url: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: isDark ? '#111622' : '#FFFFFF',
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
        message: `${translatedTitle}\n\nRead the full digest on Digestly:\n${article.sourceUrl}`,
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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const totalHeight = contentSize.height - layoutMeasurement.height;
    if (totalHeight > 0) {
      setScrollProgress(Math.min(1, Math.max(0, contentOffset.y / totalHeight)));
    }
  };

  // Font size multiplier
  const fontMultiplier = fontSize === 'sm' ? 0.9 : fontSize === 'lg' ? 1.15 : 1.0;

  // Format seconds into mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isTranslating) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" translucent />
        <ArticleDetailSkeleton />
      </View>
    );
  }

  // Render Editorial Brief with yellow/gold marker highlights
  const renderHighlightedEditorial = () => {
    const text = translatedParagraph;
    const phrases = article.highlightPhrases && article.highlightPhrases.length > 0
      ? article.highlightPhrases
      : [];

    if (phrases.length === 0) {
      return (
        <Text
          style={[
            styles.editorialBodyText,
            {
              color: isDark ? '#E2E8F0' : '#1E293B',
              fontSize: 16.5 * fontMultiplier,
              lineHeight: 27 * fontMultiplier,
            },
          ]}
        >
          {text}
        </Text>
      );
    }

    // Escape regex characters
    const escaped = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return (
      <Text
        style={[
          styles.editorialBodyText,
          {
            color: isDark ? '#E2E8F0' : '#1E293B',
            fontSize: 16.5 * fontMultiplier,
            lineHeight: 27 * fontMultiplier,
          },
        ]}
      >
        {parts.map((part, index) => {
          const isMatch = phrases.some((p) => p.toLowerCase() === part.toLowerCase());
          if (isMatch) {
            return (
              <Text
                key={index}
                style={[
                  styles.highlightedMarker,
                  {
                    backgroundColor: isDark ? 'rgba(234, 179, 8, 0.24)' : '#FEF08A',
                    color: isDark ? '#FDE047' : '#713F12',
                  },
                ]}
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
      <StatusBar barStyle="light-content" translucent />

      {/* Reading Progress Indicator */}
      <View style={[styles.progressBarContainer, { top: insets.top }]}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${scrollProgress * 100}%`,
              backgroundColor: isDark ? '#38BDF8' : '#0F172A',
            },
          ]}
        />
      </View>

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          {
            maxWidth: isTablet ? 720 : '100%',
            alignSelf: 'center',
            width: '100%',
            paddingBottom: insets.bottom + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO IMAGE CONTAINER WITH CIRCULAR TOP BAR OVERLAY */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: article.imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />

          {/* Dark gradient shadow overlay for top bar readability */}
          <View style={styles.heroOverlay} />

          {/* Top Bar Circular Buttons */}
          <View style={[styles.topBarRow, { top: insets.top + 8 }]}>
            {/* Back Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.selectionAsync();
                navigation.goBack();
              }}
              style={styles.circleActionButton}
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Right Action Buttons: Text Size, Share, Bookmark */}
            <View style={styles.topBarRightGroup}>
              {/* Text Size Toggle */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={cycleFontSize}
                style={styles.circleActionButton}
              >
                <Ionicons name="text-outline" size={19} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Share Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleShare}
                style={styles.circleActionButton}
              >
                <Ionicons name="share-outline" size={19} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Bookmark Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleToggleBookmark}
                style={styles.circleActionButton}
              >
                <Animated.View style={animatedBookmarkStyle}>
                  <Ionicons
                    name={isSaved ? 'bookmark' : 'bookmark-outline'}
                    size={19}
                    color={isSaved ? '#38BDF8' : '#FFFFFF'}
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location Badge (Bottom-Left) */}
          <View style={styles.locationPill}>
            <Ionicons name="location-outline" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.locationText}>
              {displayLocation}
            </Text>
          </View>

          {/* Photo Count (Bottom-Right) */}
          <View style={styles.photoCountPill}>
            <Ionicons name="camera-outline" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.photoCountText}>
              1 / 5
            </Text>
          </View>
        </View>

        {/* ARTICLE HEADER & METADATA */}
        <View style={styles.articleHeaderSection}>
          {/* Category Pill */}
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: isDark ? catTheme.darkBg : catTheme.bg },
            ]}
          >
            <Text
              style={[
                styles.categoryBadgeText,
                { color: isDark ? catTheme.darkText : catTheme.text },
              ]}
            >
              {article.category.toUpperCase()}
            </Text>
          </View>

          {/* Main Title */}
          <Text
            style={[
              styles.articleHeadline,
              {
                color: colors.textPrimary,
                fontSize: (isUrdu ? 26 : 24) * fontMultiplier,
                lineHeight: (isUrdu ? 36 : 31) * fontMultiplier,
              },
            ]}
          >
            {translatedTitle}
          </Text>

          {/* Verified Source Row */}
          <View style={[styles.verifiedSourceRow, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.sourceAvatarRow}>
              {/* Publisher Avatar Badge */}
              <View style={[styles.publisherAvatar, { backgroundColor: isDark ? '#1E2638' : '#E2E8F0' }]}>
                <Text style={[styles.publisherInitial, { color: colors.textPrimary }]}>
                  {article.sourceName.charAt(0)}
                </Text>
              </View>

              <View>
                <View style={styles.sourceVerifiedLine}>
                  <Text style={[styles.sourceNameText, { color: colors.textPrimary }]}>
                    {article.sourceName}
                  </Text>
                  <Ionicons name="checkmark-circle" size={14} color="#38BDF8" style={{ marginLeft: 4 }} />
                </View>

                <View style={styles.readTimeLine}>
                  <Text style={[styles.readTimeText, { color: colors.textTertiary }]}>
                    {article.publishedAt}
                  </Text>
                  <Text style={[styles.dotSeparator, { color: colors.textTertiary }]}>•</Text>
                  <Text style={[styles.readTimeText, { color: colors.textTertiary }]}>
                    {readTimeMinutes} min read
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Save Button Pill */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleToggleBookmark}
              style={[
                styles.savePillButton,
                {
                  backgroundColor: isSaved
                    ? (isDark ? '#182030' : '#E2E8F0')
                    : (isDark ? '#111622' : '#F1F5F9'),
                  borderColor: isSaved ? '#38BDF8' : colors.border,
                },
              ]}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={14}
                color={isSaved ? '#38BDF8' : colors.textSecondary}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.savePillText,
                  { color: isSaved ? (isDark ? '#38BDF8' : '#0284C7') : colors.textSecondary },
                ]}
              >
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AUDIO TTS CARD: "Listen to this article" */}
        <View style={[styles.audioCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.audioTopRow}>
            <View style={styles.audioHeaderLeft}>
              <Ionicons name="headset-outline" size={17} color={isDark ? '#38BDF8' : '#0F172A'} style={{ marginRight: 8 }} />
              <Text style={[styles.audioCardTitle, { color: colors.textPrimary }]}>
                Listen to this article
              </Text>
            </View>

            {/* Speed Pill Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={cycleSpeed}
              style={[styles.speedPill, { backgroundColor: isDark ? '#182030' : '#F1F5F9', borderColor: colors.borderLight }]}
            >
              <Text style={[styles.speedText, { color: colors.textSecondary }]}>
                {audioSpeed.toFixed(1)}x
              </Text>
            </TouchableOpacity>
          </View>

          {/* Waveform & Play Control Bar */}
          <View style={styles.audioControlRow}>
            {/* Play/Pause Circular Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleToggleAudio}
              style={[styles.playButtonCircle, { backgroundColor: isDark ? '#F8FAFC' : '#0F172A' }]}
            >
              <Ionicons
                name={isPlayingAudio ? 'pause' : 'play'}
                size={18}
                color={isDark ? '#07090E' : '#FFFFFF'}
                style={!isPlayingAudio ? { marginLeft: 2 } : undefined}
              />
            </TouchableOpacity>

            {/* Simulated Sound Waveform Bars */}
            <View style={styles.waveformContainer}>
              {[12, 24, 18, 28, 14, 22, 10, 26, 16, 20, 12, 18].map((h, i) => {
                const animMultiplier = i % 4 === 0 ? waveAnim1 : i % 4 === 1 ? waveAnim2 : i % 4 === 2 ? waveAnim3 : waveAnim4;
                return (
                  <Animated.View
                    key={i}
                    style={[
                      styles.waveBar,
                      {
                        height: h,
                        backgroundColor: isPlayingAudio
                          ? (isDark ? '#38BDF8' : '#0F172A')
                          : (isDark ? '#2A364F' : '#CBD5E1'),
                      },
                    ]}
                  />
                );
              })}
            </View>

            {/* Duration Timer */}
            <Text style={[styles.audioTimerText, { color: colors.textTertiary }]}>
              {isPlayingAudio ? `${formatTime(audioElapsedSeconds)} / 1:30` : '1:30'}
            </Text>
          </View>
        </View>

        {/* THE EDITORIAL BRIEF */}
        <View style={[styles.editorialCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconCircle, { backgroundColor: isDark ? '#182030' : '#F1F5F9' }]}>
              <Ionicons name="sparkles" size={15} color={isDark ? '#FBBF24' : '#D97706'} />
            </View>
            <Text style={[styles.sectionHeaderTitle, { color: colors.textPrimary }]}>
              The Editorial Brief
            </Text>
          </View>

          {/* Highlighted Paragraph */}
          <View style={styles.editorialContentBox}>
            {renderHighlightedEditorial()}
          </View>
        </View>

        {/* KEY TAKEAWAYS */}
        <View style={styles.keyTakeawaysSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconCircle, { backgroundColor: isDark ? '#182030' : '#F1F5F9' }]}>
              <Ionicons name="list-outline" size={16} color={colors.textPrimary} />
            </View>
            <Text style={[styles.sectionHeaderTitle, { color: colors.textPrimary }]}>
              Key Takeaways
            </Text>
          </View>

          {/* Numbered Cards (1, 2, 3) */}
          {translatedSummary.map((item, index) => (
            <View
              key={index}
              style={[
                styles.takeawayCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={[styles.takeawayNumberBadge, { backgroundColor: isDark ? '#182030' : '#F1F5F9' }]}>
                <Text style={[styles.takeawayNumberText, { color: isDark ? '#38BDF8' : '#0F172A' }]}>
                  {index + 1}
                </Text>
              </View>

              <Text
                style={[
                  styles.takeawayText,
                  {
                    color: colors.textPrimary,
                    fontSize: 14.5 * fontMultiplier,
                    lineHeight: 21 * fontMultiplier,
                  },
                ]}
              >
                {item}
              </Text>

              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} style={styles.takeawayChevron} />
            </View>
          ))}
        </View>

        {/* MULTI-SOURCE PERSPECTIVES */}
        {article.relatedSources && article.relatedSources.length > 0 && (
          <View style={styles.perspectivesSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconCircle, { backgroundColor: isDark ? '#182030' : '#F1F5F9' }]}>
                <Ionicons name="git-branch-outline" size={16} color={colors.textPrimary} />
              </View>
              <Text style={[styles.sectionHeaderTitle, { color: colors.textPrimary }]}>
                Multi-Source Perspectives
              </Text>
            </View>

            {article.relatedSources.map((rel, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.85}
                onPress={() => handleOpenSource(rel.sourceUrl)}
                style={[
                  styles.perspectiveCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.perspectiveTopRow}>
                  <View style={[styles.perspectivePublisherTag, { backgroundColor: isDark ? '#182030' : '#F1F5F9' }]}>
                    <Text style={[styles.perspectivePublisherText, { color: colors.textPrimary }]}>
                      {rel.sourceName}
                    </Text>
                  </View>
                  <Ionicons name="open-outline" size={14} color={colors.textTertiary} />
                </View>

                <Text style={[styles.perspectiveHeadline, { color: colors.textPrimary }]}>
                  {rel.headline}
                </Text>

                <Text style={[styles.perspectiveAngle, { color: colors.textSecondary }]}>
                  Angle: {rel.angleHighlight}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* BOTTOM FLOATING ACTION BAR: SIDE-BY-SIDE BUTTONS */}
      <View
        style={[
          styles.bottomActionBar,
          {
            backgroundColor: isDark ? 'rgba(7, 9, 14, 0.94)' : 'rgba(255, 255, 255, 0.94)',
            borderTopColor: colors.borderLight,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        {/* Read Full Original Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handleOpenSource(article.sourceUrl)}
          style={[styles.bottomBtnOriginal, { backgroundColor: isDark ? '#F8FAFC' : '#0F172A' }]}
        >
          <Ionicons name="open-outline" size={17} color={isDark ? '#07090E' : '#FFFFFF'} style={{ marginRight: 7 }} />
          <Text style={[styles.bottomBtnOriginalText, { color: isDark ? '#07090E' : '#FFFFFF' }]}>
            Read Full Original
          </Text>
        </TouchableOpacity>

        {/* Share Brief Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleShare}
          style={[styles.bottomBtnShare, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="share-social-outline" size={17} color={colors.textPrimary} style={{ marginRight: 6 }} />
          <Text style={[styles.bottomBtnShareText, { color: colors.textPrimary }]}>
            Share Brief
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    zIndex: 100,
  },
  progressBar: {
    height: 3,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroContainer: {
    position: 'relative',
    width: '100%',
    height: 320,
    backgroundColor: '#000000',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  topBarRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  topBarRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(17, 22, 34, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  locationPill: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  photoCountPill: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  photoCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  articleHeaderSection: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  articleHeadline: {
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  verifiedSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  sourceAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  publisherAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  publisherInitial: {
    fontSize: 16,
    fontWeight: '800',
  },
  sourceVerifiedLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceNameText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  readTimeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  readTimeText: {
    fontSize: 12,
  },
  dotSeparator: {
    marginHorizontal: 5,
    fontSize: 12,
  },
  savePillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  savePillText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  audioCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  audioTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  audioHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioCardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  speedPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  speedText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  audioControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButtonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    marginRight: 12,
  },
  waveBar: {
    width: 3.5,
    borderRadius: 2,
    marginRight: 4,
  },
  audioTimerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editorialCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  editorialContentBox: {
    marginTop: 2,
  },
  editorialBodyText: {
    letterSpacing: -0.1,
  },
  highlightedMarker: {
    fontWeight: '600',
    paddingHorizontal: 3,
    borderRadius: 3,
  },
  keyTakeawaysSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  takeawayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 13,
    marginBottom: 10,
  },
  takeawayNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  takeawayNumberText: {
    fontSize: 14,
    fontWeight: '800',
  },
  takeawayText: {
    flex: 1,
    fontWeight: '500',
  },
  takeawayChevron: {
    marginLeft: 8,
  },
  perspectivesSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  perspectiveCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  perspectiveTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  perspectivePublisherTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  perspectivePublisherText: {
    fontSize: 11,
    fontWeight: '700',
  },
  perspectiveHeadline: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
    marginBottom: 6,
  },
  perspectiveAngle: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  bottomBtnOriginal: {
    flex: 1.2,
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bottomBtnOriginalText: {
    fontSize: 14,
    fontWeight: '700',
  },
  bottomBtnShare: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBtnShareText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
