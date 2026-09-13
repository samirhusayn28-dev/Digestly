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
import { DigestlyWordmark } from '../components/common/DigestlyWordmark';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

interface SplashSlide {
  id: string;
  imageUri: string;
  headlineLine1: string;
  headlineAccent: string;
  accentColor: string;
  bodyText: string;
}

const SPLASH_SLIDES: SplashSlide[] = [
  {
    id: '1',
    imageUri:
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
    headlineLine1: 'Essential news,',
    headlineAccent: 'distilled in seconds.',
    accentColor: '#38BDF8',
    bodyText: "Objective 3-sentence briefings synthesised from Pakistan's most respected editorial desks.",
  },
  {
    id: '2',
    imageUri:
      'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80',
    headlineLine1: 'Every perspective,',
    headlineAccent: 'without the noise.',
    accentColor: '#34D399',
    bodyText: 'Cross-referenced coverage comparing Dawn, Express Tribune, Geo News, and global publishers.',
  },
  {
    id: '3',
    imageUri:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    headlineLine1: 'Stay ahead of what',
    headlineAccent: 'actually matters.',
    accentColor: '#FBBF24',
    bodyText: 'Curated intelligence across business, politics, technology, and global affairs.',
  },
];

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const user = useAppStore((state) => state.user);
  const isGuest = useAppStore((state) => state.isGuest);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const setHasCompletedOnboarding = useAppStore((state) => state.setHasCompletedOnboarding);

  // Skip splash if user already logged in or completed onboarding
  useEffect(() => {
    if (hasCompletedOnboarding || user || isGuest) {
      navigation.replace('MainTabs');
    }
  }, [hasCompletedOnboarding, user, isGuest]);

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
    setHasCompletedOnboarding(true);
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
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Deep dark gradient overlays for minimal contrast */}
        <View style={styles.topVignette} />
        <View style={styles.bottomVignette} />

        {/* Slide Bottom Content */}
        <View
          style={[
            styles.slideContent,
            { paddingBottom: insets.bottom + 96, paddingHorizontal: 28 },
          ]}
        >
          {/* Bold two-line headline with accent colored phrase */}
          <Text style={styles.headlineLine1}>{item.headlineLine1}</Text>
          <Text style={[styles.headlineAccent, { color: item.accentColor }]}>
            {item.headlineAccent}
          </Text>

          {/* Clean one-line muted gray supporting text */}
          <Text style={styles.bodyText}>{item.bodyText}</Text>
        </View>
      </ImageBackground>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Minimal Top Header */}
      <View
        style={[
          styles.topHeader,
          {
            top: insets.top + 12,
            paddingHorizontal: 28,
          },
        ]}
      >
        <DigestlyWordmark size="md" color="#FFFFFF" />

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

      {/* Bottom Controls: Minimal dots + circular white arrow */}
      <View
        style={[
          styles.bottomControls,
          {
            bottom: insets.bottom + 26,
            paddingHorizontal: 28,
          },
        ]}
      >
        {/* Pagination Dots */}
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

        {/* Circular Next Button */}
        <TouchableOpacity
          activeOpacity={0.88}
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
  slideContainer: {
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: 'rgba(7, 9, 14, 0.45)',
  },
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 480,
    backgroundColor: 'rgba(7, 9, 14, 0.88)',
  },
  topHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(17, 22, 34, 0.6)',
  },
  skipText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  slideContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  headlineLine1: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  headlineAccent: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 38,
    marginBottom: 14,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#94A3B8',
    letterSpacing: -0.1,
  },
  bottomControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
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
    shadowRadius: 6,
    elevation: 4,
  },
});
