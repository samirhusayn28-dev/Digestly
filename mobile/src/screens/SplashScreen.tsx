import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { useAppStore } from '../store/useAppStore';
import { DigestlyWordmark } from '../components/common/DigestlyWordmark';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

interface SlideData {
  id: string;
  badge: string;
  badgeColor: string;
  headlineLine1: string;
  headlineAccent: string;
  accentColor: string;
  subtext: string;
  renderIllustration: () => React.ReactNode;
}

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const user = useAppStore((state) => state.user);
  const isGuest = useAppStore((state) => state.isGuest);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const setHasCompletedOnboarding = useAppStore((state) => state.setHasCompletedOnboarding);

  // If already logged in or completed onboarding, immediately bypass to main app
  useEffect(() => {
    if (hasCompletedOnboarding || user || isGuest) {
      navigation.replace('MainTabs');
    }
  }, [hasCompletedOnboarding, user, isGuest]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setHasCompletedOnboarding(true);
    if (user || isGuest) {
      navigation.replace('MainTabs');
    } else {
      navigation.replace('Login');
    }
  };

  const slides: SlideData[] = [
    {
      id: '1',
      badge: 'THE 60-SECOND BRIEF',
      badgeColor: '#38BDF8',
      headlineLine1: 'Essential news.',
      headlineAccent: 'In sixty seconds.',
      accentColor: '#38BDF8',
      subtext: "Objective three-sentence briefings synthesized from Pakistan's most trusted desks.",
      renderIllustration: () => (
        <View style={styles.cardContainer}>
          {/* Ambient Glow */}
          <View style={[styles.glowEffect, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]} />

          <View style={styles.showcaseCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTimerPill}>
                <Ionicons name="timer-outline" size={13} color="#38BDF8" style={{ marginRight: 4 }} />
                <Text style={styles.cardTimerText}>60s Digest</Text>
              </View>
              <View style={styles.cardLiveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            {/* Brief Headline Mockup */}
            <Text style={styles.cardHeadline}>State Bank Maintains Benchmark Policy Rate at 11%</Text>

            {/* 3 Digest Bullet Lines */}
            <View style={styles.bulletList}>
              <View style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: '#38BDF8' }]} />
                <View style={[styles.bulletLine, { width: '88%' }]} />
              </View>
              <View style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: '#38BDF8' }]} />
                <View style={[styles.bulletLine, { width: '74%' }]} />
              </View>
              <View style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: '#38BDF8' }]} />
                <View style={[styles.bulletLine, { width: '92%' }]} />
              </View>
            </View>

            {/* Footer tags */}
            <View style={styles.cardFooter}>
              <Text style={styles.sourceTag}>Dawn • The Express Tribune • Geo</Text>
              <Text style={styles.readTime}>45s read</Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      id: '2',
      badge: 'CROSS-CHECKED REPORTING',
      badgeColor: '#34D399',
      headlineLine1: 'Every perspective.',
      headlineAccent: 'Zero bias.',
      accentColor: '#34D399',
      subtext: 'Cross-referenced coverage comparing Dawn, Tribune, Geo, and global publishers side-by-side.',
      renderIllustration: () => (
        <View style={styles.cardContainer}>
          {/* Ambient Glow */}
          <View style={[styles.glowEffect, { backgroundColor: 'rgba(52, 211, 153, 0.12)' }]} />

          <View style={styles.multiSourceWrapper}>
            {/* Source Card 1 */}
            <View style={[styles.sourceCard, styles.sourceCardTop]}>
              <View style={styles.sourceRow}>
                <Text style={styles.sourceBadgeName}>Dawn</Text>
                <Text style={styles.sourceTime}>Editorial Focus</Text>
              </View>
              <Text style={styles.sourceHeadline} numberOfLines={1}>
                MPC highlights disinflation trajectory and current account surplus.
              </Text>
            </View>

            {/* Source Card 2 */}
            <View style={[styles.sourceCard, styles.sourceCardMiddle]}>
              <View style={styles.sourceRow}>
                <Text style={[styles.sourceBadgeName, { color: '#34D399' }]}>The Express Tribune</Text>
                <Text style={styles.sourceTime}>Market View</Text>
              </View>
              <Text style={styles.sourceHeadline} numberOfLines={1}>
                Industrial manufacturers advocate calibrated rate cuts by Q2.
              </Text>
            </View>

            {/* Source Card 3 */}
            <View style={[styles.sourceCard, styles.sourceCardBottom]}>
              <View style={styles.sourceRow}>
                <Text style={[styles.sourceBadgeName, { color: '#FBBF24' }]}>Geo News</Text>
                <Text style={styles.sourceTime}>Government Desk</Text>
              </View>
              <Text style={styles.sourceHeadline} numberOfLines={1}>
                Finance Ministry confirms fiscal targets remain on track.
              </Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      id: '3',
      badge: 'INTELLIGENT BRIEFING',
      badgeColor: '#FBBF24',
      headlineLine1: 'Your daily brief.',
      headlineAccent: 'Always ready.',
      accentColor: '#FBBF24',
      subtext: 'Curated morning intelligence with smart push updates and instant audio narration.',
      renderIllustration: () => (
        <View style={styles.cardContainer}>
          {/* Ambient Glow */}
          <View style={[styles.glowEffect, { backgroundColor: 'rgba(251, 191, 36, 0.12)' }]} />

          <View style={styles.executiveCard}>
            <View style={styles.execHeader}>
              <Ionicons name="sparkles" size={15} color="#FBBF24" style={{ marginRight: 6 }} />
              <Text style={styles.execHeaderTitle}>MORNING INTELLIGENCE</Text>
            </View>

            <View style={styles.topicPillsRow}>
              <View style={[styles.topicPill, { borderColor: '#38BDF8' }]}>
                <Text style={[styles.topicPillText, { color: '#38BDF8' }]}>Politics</Text>
              </View>
              <View style={[styles.topicPill, { borderColor: '#34D399' }]}>
                <Text style={[styles.topicPillText, { color: '#34D399' }]}>Economy</Text>
              </View>
              <View style={[styles.topicPill, { borderColor: '#A78BFA' }]}>
                <Text style={[styles.topicPillText, { color: '#A78BFA' }]}>Technology</Text>
              </View>
            </View>

            {/* Audio waveform mockup */}
            <View style={styles.audioWaveBox}>
              <View style={styles.audioIconCircle}>
                <Ionicons name="volume-medium" size={16} color="#05070B" />
              </View>
              <View style={styles.waveformContainer}>
                {[14, 22, 10, 26, 18, 12, 28, 16, 22, 14, 20, 8, 24, 18, 10, 26].map((h, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveBar,
                      {
                        height: h,
                        backgroundColor: i < 7 ? '#FBBF24' : 'rgba(255, 255, 255, 0.25)',
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.audioDuration}>3:45</Text>
            </View>
          </View>
        </View>
      ),
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top Header */}
      <View style={[styles.topHeader, { top: insets.top + 14 }]}>
        <View style={styles.brandRow}>
          <DigestlyWordmark size="md" color="#FFFFFF" />
          <View style={styles.brandPill}>
            <Text style={styles.brandPillText}>BRIEFINGS</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={finishOnboarding}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width, height }]}>
            {/* Center Visual Motif */}
            <View style={styles.illustrationArea}>{item.renderIllustration()}</View>

            {/* Bottom Copy Section */}
            <View style={[styles.copyContainer, { paddingBottom: insets.bottom + 88 }]}>
              {/* Category Micro-Badge */}
              <View style={[styles.slideBadge, { borderColor: item.badgeColor }]}>
                <Text style={[styles.slideBadgeText, { color: item.badgeColor }]}>
                  {item.badge}
                </Text>
              </View>

              {/* Headline */}
              <Text style={styles.headlineLine1}>{item.headlineLine1}</Text>
              <Text style={[styles.headlineAccent, { color: item.accentColor }]}>
                {item.headlineAccent}
              </Text>

              {/* 1-Line Supporting Subtext */}
              <Text style={styles.subtext}>{item.subtext}</Text>
            </View>
          </View>
        )}
      />

      {/* Bottom Floating Navigation Controls */}
      <View style={[styles.bottomBar, { bottom: insets.bottom + 18 }]}>
        {/* Pagination Dots/Pills */}
        <View style={styles.paginationRow}>
          {slides.map((_, i) => {
            const isActive = i === currentIndex;
            return (
              <View
                key={i}
                style={[
                  styles.paginationDot,
                  isActive ? styles.paginationPillActive : styles.paginationDotInactive,
                ]}
              />
            );
          })}
        </View>

        {/* Circular Next Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleNext}
          style={styles.nextButton}
        >
          <Ionicons
            name={currentIndex === slides.length - 1 ? 'arrow-forward' : 'arrow-forward'}
            size={22}
            color="#05070B"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05070B',
  },
  topHeader: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  brandPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  slide: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
  },
  illustrationArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  showcaseCard: {
    width: '100%',
    backgroundColor: '#0D131F',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTimerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardTimerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  cardLiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  cardHeadline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 22,
    marginBottom: 16,
  },
  bulletList: {
    gap: 10,
    marginBottom: 16,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  bulletLine: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E293B',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#161F2E',
  },
  sourceTag: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  readTime: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
  },
  multiSourceWrapper: {
    width: '100%',
    gap: 10,
  },
  sourceCard: {
    backgroundColor: '#0D131F',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
  },
  sourceCardTop: {
    opacity: 0.9,
  },
  sourceCardMiddle: {
    borderColor: 'rgba(52, 211, 153, 0.3)',
    backgroundColor: '#0E1724',
  },
  sourceCardBottom: {
    opacity: 0.85,
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sourceBadgeName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sourceTime: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },
  sourceHeadline: {
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 17,
  },
  executiveCard: {
    width: '100%',
    backgroundColor: '#0D131F',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 20,
  },
  execHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  execHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 1,
  },
  topicPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  topicPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  topicPillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  audioWaveBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#070A10',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  audioIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 28,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  audioDuration: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  copyContainer: {
    alignItems: 'flex-start',
  },
  slideBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  slideBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headlineLine1: {
    fontSize: 30,
    fontWeight: '800',
    color: '#F8FAFC',
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  headlineAccent: {
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    letterSpacing: -0.6,
    marginBottom: 12,
  },
  subtext: {
    fontSize: 14.5,
    color: '#94A3B8',
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  bottomBar: {
    position: 'absolute',
    left: 28,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },
  paginationPillActive: {
    width: 26,
    backgroundColor: '#38BDF8',
  },
  paginationDotInactive: {
    width: 6,
    backgroundColor: '#1E293B',
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
});
