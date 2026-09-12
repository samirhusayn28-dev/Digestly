import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge: string;
  title: string;
  subtitle: string;
  urduSummary: string;
}

const slides: Slide[] = [
  {
    id: '1',
    icon: 'sparkles',
    badge: 'AI-DISTILLED',
    title: 'The whole story in three concise lines.',
    subtitle:
      'Groq-powered AI cuts through 1,500 words of filler. Get the critical facts from Dawn, Tribune, and Geo in under 15 seconds.',
    urduSummary: 'پورے مضمون کا نچوڑ صرف تین لائنوں میں',
  },
  {
    id: '2',
    icon: 'git-compare',
    badge: 'MULTI-SOURCE',
    title: 'See beyond a single headline.',
    subtitle:
      'Every major event is analyzed across Pakistani publishers so you see differing editorial tones and angles side-by-side.',
    urduSummary: 'ایک ہی خبر کے مختلف زاویے اور تجزیے',
  },
  {
    id: '3',
    icon: 'compass',
    badge: 'PERSONALIZED',
    title: 'Your nation, your curated radar.',
    subtitle:
      'Select your focus—from Politics to Tech, Economy, and Sports. Enjoy clean, high-bandwidth Pakistani journalism.',
    urduSummary: 'آپ کی پسند کے مطابق ذاتی نوعیت کی خبریں',
  },
];

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const { colors, typography } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const setHasCompletedOnboarding = useAppStore((state) => state.setHasCompletedOnboarding);

  const handleFinishOnboarding = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasCompletedOnboarding(true);
    navigation.replace('Login');
  };

  const handleNext = () => {
    Haptics.selectionAsync();
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinishOnboarding();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Top Header / Skip */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Text style={[typography.h3, { color: colors.textPrimary, fontWeight: '700' }]}>
            Digestly
          </Text>
          <View style={[styles.urduSmallBadge, { backgroundColor: colors.accentSubtle }]}>
            <Text style={[styles.urduSmallText, { color: colors.accent }]}>مختصر</Text>
          </View>
        </View>

        {currentIndex < slides.length - 1 ? (
          <TouchableOpacity onPress={handleFinishOnboarding} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Slides FlatList */}
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                  shadowColor: colors.accent,
                },
              ]}
            >
              <Ionicons name={item.icon} size={46} color={colors.accent} />
            </View>

            <View style={[styles.badge, { backgroundColor: colors.accentSubtle }]}>
              <Text style={[typography.badge, { color: colors.accent }]}>{item.badge}</Text>
            </View>

            <Text style={[typography.h1, styles.title, { color: colors.textPrimary }]}>
              {item.title}
            </Text>

            <Text style={[typography.body, styles.subtitle, { color: colors.textSecondary }]}>
              {item.subtitle}
            </Text>

            <View style={[styles.urduBox, { backgroundColor: colors.surfaceSubtle }]}>
              <Text style={[styles.urduSubtitle, { color: colors.textSecondary }]}>
                {item.urduSummary}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Footer Controls: Dots + Button */}
      <View style={styles.footer}>
        <View style={styles.paginationDots}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentIndex ? colors.accent : colors.border,
                  width: index === currentIndex ? 28 : 8,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleNext}
          style={[styles.primaryButton, { backgroundColor: colors.accent }]}
        >
          <Text style={[typography.button, { color: '#FFFFFF' }]}>
            {currentIndex === slides.length - 1 ? 'Start Reading' : 'Continue'}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color="#FFFFFF"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urduSmallBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  urduSmallText: {
    fontSize: 12,
    fontWeight: '700',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 14,
  },
  title: {
    textAlign: 'center',
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  urduBox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 4,
  },
  urduSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 16,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 14,
  },
});
