import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { DigestlyLogo } from '../components/common/DigestlyLogo';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge: string;
  title: string;
  subtitle: string;
  highlight: string;
}

const slides: Slide[] = [
  {
    id: '1',
    icon: 'flash-outline',
    badge: '3-LINE BRIEFS',
    title: 'The whole story in three essential lines.',
    subtitle:
      'Groq-powered AI cuts through 1,500 words of filler. Get the critical facts from Dawn, Tribune, and Geo in under 15 seconds.',
    highlight: 'High-density facts: names, numbers, key outcomes.',
  },
  {
    id: '2',
    icon: 'git-network-outline',
    badge: 'MULTI-SOURCE',
    title: 'See beyond a single headline.',
    subtitle:
      'Major events are analyzed across premier Pakistani publishers so you can compare differing editorial tones and angles side-by-side.',
    highlight: 'Balanced perspectives across competing outlets.',
  },
  {
    id: '3',
    icon: 'sparkles-outline',
    badge: 'CURATED RADAR',
    title: 'Your nation, your personalized focus.',
    subtitle:
      'Customize your news stream across Politics, Business, Tech, World, and Sports with clean, distraction-free reading.',
    highlight: 'Zero clickbait, zero fluff, pure signal.',
  },
];

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    Haptics.selectionAsync();
    navigation.replace('Login');
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      {/* Visual Badge Card */}
      <View
        style={[
          styles.badgeCard,
          {
            backgroundColor: colors.surfaceSubtle,
            borderColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: isDark ? colors.accentSubtle : '#FFFFFF' },
          ]}
        >
          <Ionicons name={item.icon} size={28} color={isDark ? colors.accentBlue : colors.accent} />
        </View>

        <View style={[styles.badgeTag, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
          <Text style={[typography.badge, { color: colors.textPrimary, fontSize: 10 }]}>
            {item.badge}
          </Text>
        </View>
      </View>

      <Text style={[typography.h1, styles.slideTitle, { color: colors.textPrimary }]}>
        {item.title}
      </Text>

      <Text style={[typography.body, styles.slideSubtitle, { color: colors.textSecondary }]}>
        {item.subtitle}
      </Text>

      {/* Editorial bullet highlight */}
      <View
        style={[
          styles.highlightBox,
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
        ]}
      >
        <Ionicons
          name="checkmark-circle"
          size={16}
          color={colors.accentBlue}
          style={{ marginRight: 8 }}
        />
        <Text style={[typography.bodySmall, { color: colors.textPrimary, flex: 1, fontWeight: '500' }]}>
          {item.highlight}
        </Text>
      </View>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.brandGroup}>
          <DigestlyLogo size="sm" />
          <Text style={[typography.h3, styles.brandName, { color: colors.textPrimary }]}>
            Digestly
          </Text>
        </View>

        {currentIndex < slides.length - 1 && (
          <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '600' }]}>
              Skip
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slide Carousel */}
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(s) => s.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const newIdx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIdx);
        }}
        style={{ flex: 1 }}
      />

      {/* Bottom Actions & Pagination Dots */}
      <View style={styles.bottomSection}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: currentIndex === i ? 20 : 6,
                  backgroundColor: currentIndex === i ? colors.accent : colors.border,
                },
              ]}
            />
          ))}
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleNext}
          style={[styles.actionBtn, { backgroundColor: colors.accent }]}
        >
          <Text style={[typography.button, { color: isDark ? '#0B0E14' : '#FFFFFF' }]}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={16}
            color={isDark ? '#0B0E14' : '#FFFFFF'}
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandName: {
    marginLeft: 8,
    fontWeight: '700',
  },
  slide: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCard: {
    width: 100,
    height: 100,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  badgeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slideTitle: {
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  slideSubtitle: {
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    maxWidth: 380,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  actionBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
