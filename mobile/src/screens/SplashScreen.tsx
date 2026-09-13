import React, { useState, useRef } from 'react';
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
  bodyText: string;
  captionIcon: keyof typeof Ionicons.glyphMap;
  captionText: string;
  accentColor: string;
}

const SPLASH_SLIDES: SplashSlide[] = [
  {
    id: '1',
    imageUri:
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
    headlineLine1: 'The whole story in',
    headlineAccent: 'three essential lines.',
    bodyText: "Direct, objective news briefs synthesised by AI from Pakistan's most trusted editorial desks.",
    captionIcon: 'document-text-outline',
    captionText: 'Concise, verified 3-bullet executive briefs.',
    accentColor: '#38BDF8',
  },
  {
    id: '2',
    imageUri:
      'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80',
    headlineLine1: 'See beyond a',
    headlineAccent: 'single headline.',
    bodyText: 'Cross-referenced reporting from Dawn, Express Tribune, Geo News, BBC World, and Al Jazeera.',
    captionIcon: 'scale-outline',
    captionText: 'Balanced viewpoints and multiple editorial angles.',
    accentColor: '#34D399',
  },
  {
    id: '3',
    imageUri:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    headlineLine1: 'Your nation, your',
    headlineAccent: 'personalized focus.',
    bodyText: 'Select your interests and stay ahead of breaking political, economic, and global developments.',
    captionIcon: 'options-outline',
    captionText: 'Tailored intelligence across 10 curated categories.',
    accentColor: '#FBBF24',
  },
];

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const user = useAppStore((state) => state.user);
  const isGuest = useAppStore((state) => state.isGuest);

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
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Dark gradient vignettes for editorial contrast */}
        <View style={styles.topVignette} />
        <View style={styles.bottomVignette} />

        {/* Slide Bottom Content */}
        <View
          style={[
            styles.slideContent,
            { paddingBottom: insets.bottom + 105, paddingHorizontal: 26 },
          ]}
        >
          {/* Large bold headline with accent color on second line */}
          <Text style={styles.headlineLine1}>{item.headlineLine1}</Text>
          <Text style={[styles.headlineAccent, { color: item.accentColor }]}>
            {item.headlineAccent}
          </Text>

          {/* Short body text */}
          <Text style={styles.bodyText}>{item.bodyText}</Text>

          {/* Icon + caption row */}
          <View style={styles.captionRow}>
            <View style={styles.captionIconWrap}>
              <Ionicons name={item.captionIcon} size={15} color="#FFFFFF" />
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

      {/* Top Bar: Digestly Wordmark (no square D icon) + Skip Link */}
      <View
        style={[
          styles.topHeader,
          {
            top: insets.top + 10,
            paddingHorizontal: 24,
          },
        ]}
      >
        <DigestlyWordmark size="lg" color="#FFFFFF" />

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
            bottom: insets.bottom + 26,
            paddingHorizontal: 26,
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

        {/* Circular White Button with Arrow */}
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
    fontSize: 14.5,
    lineHeight: 22,
    color: '#CBD5E1',
    marginBottom: 16,
    letterSpacing: -0.1,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 22, 34, 0.65)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  captionIconWrap: {
    marginRight: 8,
  },
  captionText: {
    fontSize: 12.5,
    color: '#E2E8F0',
    fontWeight: '500',
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
