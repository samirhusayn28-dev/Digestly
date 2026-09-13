import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
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
import { DigestlyLogo } from '../components/common/DigestlyLogo';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

interface SplashSlide {
  id: string;
  imageUri: string;
  headlinePrefix: string;
  headlineAccent: string;
  captionIcon: keyof typeof Ionicons.glyphMap;
  captionText: string;
  accentColor: string;
}

const SPLASH_SLIDES: SplashSlide[] = [
  {
    id: '1',
    imageUri:
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80', // Newspaper at sunset
    headlinePrefix: 'Unbiased news,\n',
    headlineAccent: 'synthesized.',
    captionIcon: 'flash-outline',
    captionText: 'Direct fact briefs extracted from leading national and international desks.',
    accentColor: '#38BDF8',
  },
  {
    id: '2',
    imageUri:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80', // Hand holding phone / media
    headlinePrefix: 'Multi-source\n',
    headlineAccent: 'clarity.',
    captionIcon: 'git-network-outline',
    captionText: 'Read balanced angles and cross-referenced coverage from Dawn, Tribune, Geo, and BBC.',
    accentColor: '#34D399',
  },
  {
    id: '3',
    imageUri:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80', // Dark Earth globe at night
    headlinePrefix: 'Tailored to your\n',
    headlineAccent: 'rhythm.',
    captionIcon: 'sparkles-outline',
    captionText: 'Choose the topics you care about most, updated in real time.',
    accentColor: '#FBBF24',
  },
];

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const isGuest = useAppStore((state) => state.isGuest);
  const user = useAppStore((state) => state.user);

  useEffect(() => {
    // If user has already completed onboarding or is guest, can skip to MainTabs
    if (hasCompletedOnboarding || isGuest || user) {
      // Allow user to see splash or navigate immediately if returning
    }
  }, [hasCompletedOnboarding, isGuest, user]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SPLASH_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      finishSplash();
    }
  };

  const finishSplash = () => {
    Haptics.selectionAsync();
    if (user || isGuest) {
      navigation.replace('MainTabs');
    } else {
      navigation.replace('Login');
    }
  };

  const renderSlide = ({ item }: { item: SplashSlide }) => (
    <View style={[styles.slideContainer, { width, height }]}>
      <ImageBackground
        source={{ uri: item.imageUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        {/* Dark gradient overlay layers for text readability */}
        <View style={styles.topVignette} />
        <View style={styles.bottomVignette} />

        {/* Slide Bottom Content */}
        <View
          style={[
            styles.slideContent,
            { paddingBottom: insets.bottom + 90, paddingHorizontal: 28 },
          ]}
        >
          {/* Bold headline with colored accent word */}
          <Text style={styles.headline}>
            {item.headlinePrefix}
            <Text style={{ color: item.accentColor }}>{item.headlineAccent}</Text>
          </Text>

          {/* Caption with icon */}
          <View style={styles.captionRow}>
            <View style={styles.captionIconCircle}>
              <Ionicons name={item.captionIcon} size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.captionText}>{item.captionText}</Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top Header Row with Logo & Skip Button */}
      <View
        style={[
          styles.topHeader,
          {
            top: insets.top + 12,
            paddingHorizontal: 24,
          },
        ]}
      >
        <View style={styles.brandRow}>
          <DigestlyLogo size="sm" />
          <Text style={styles.brandTitle}>Digestly</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={finishSplash}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slide Carousel */}
      <FlatList
        ref={flatListRef}
        data={SPLASH_SLIDES}
        keyExtractor={(s) => s.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const newIdx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIdx);
        }}
        bounces={false}
      />

      {/* Bottom Controls Bar: 3 Dots + Circular White Arrow */}
      <View
        style={[
          styles.bottomControls,
          {
            bottom: insets.bottom + 20,
            paddingHorizontal: 28,
          },
        ]}
      >
        {/* 3-dot slide indicator */}
        <View style={styles.dotsContainer}>
          {SPLASH_SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                currentIndex === idx ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Circular White Button with Right Arrow */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleNext}
          style={styles.arrowCircleButton}
        >
          <Ionicons name="arrow-forward" size={22} color="#07090E" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  topHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
    letterSpacing: 0.2,
  },
  slideContainer: {
    flex: 1,
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'rgba(7, 9, 14, 0.55)',
  },
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    backgroundColor: 'rgba(7, 9, 14, 0.88)',
  },
  slideContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  headline: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 46,
    letterSpacing: -0.8,
    marginBottom: 16,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    maxWidth: '92%',
  },
  captionIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  captionText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    fontWeight: '400',
    flex: 1,
  },
  bottomControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#FFFFFF',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  arrowCircleButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
