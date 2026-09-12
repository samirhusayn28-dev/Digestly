import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { syncUserProfileToFirestore } from '../services/firebase';
import { DigestlyLogo } from '../components/common/DigestlyLogo';

type Props = NativeStackScreenProps<RootStackParamList, 'Interests'>;

export interface CategoryItem {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  desc: string;
}

export const ALL_CATEGORIES: CategoryItem[] = [
  { name: 'Top Stories', icon: 'sparkles-outline', desc: 'Leading editorial headlines across Pakistan' },
  { name: 'Politics', icon: 'shield-checkmark-outline', desc: 'Governance, parliamentary policy & diplomacy' },
  { name: 'Business', icon: 'trending-up-outline', desc: 'Macroeconomy, trade, currency & PSX' },
  { name: 'Finance', icon: 'cash-outline', desc: 'Banking, foreign reserves & market investments' },
  { name: 'Tech', icon: 'hardware-chip-outline', desc: 'Startups, telecom, mobile & digital economy' },
  { name: 'AI', icon: 'planet-outline', desc: 'Artificial intelligence & automation developments' },
  { name: 'Science', icon: 'flask-outline', desc: 'Research, discoveries & space exploration' },
  { name: 'Health', icon: 'fitness-outline', desc: 'Public health, medical research & wellness' },
  { name: 'Sports', icon: 'trophy-outline', desc: 'Cricket, PCB, PSL, football & athletics' },
  { name: 'World', icon: 'globe-outline', desc: 'Global geopolitics & South Asian affairs' },
  { name: 'Entertainment', icon: 'film-outline', desc: 'Cinema, music, drama & performing arts' },
  { name: 'Culture', icon: 'color-palette-outline', desc: 'Heritage, literature, architecture & history' },
  { name: 'Lifestyle', icon: 'cafe-outline', desc: 'Urban living, design, trends & wellness' },
  { name: 'Education', icon: 'school-outline', desc: 'Universities, academic policy & student reform' },
  { name: 'Environment', icon: 'leaf-outline', desc: 'Climate resilience, ecology & water conservation' },
  { name: 'Travel', icon: 'airplane-outline', desc: 'Northern territories, tourism & destinations' },
  { name: 'Food', icon: 'restaurant-outline', desc: 'Culinary traditions, agriculture & restaurants' },
  { name: 'Automotive', icon: 'car-sport-outline', desc: 'EVs, auto manufacturing & transport infra' },
];

export const InterestsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark } = useTheme();
  const user = useAppStore((state) => state.user);
  const isGuest = useAppStore((state) => state.isGuest);
  const selectedInterests = useAppStore((state) => state.selectedInterests);
  const setSelectedInterests = useAppStore((state) => state.setSelectedInterests);
  const setHasSelectedInterests = useAppStore((state) => state.setHasSelectedInterests);

  const [selected, setSelected] = useState<string[]>(
    selectedInterests.length > 0 ? selectedInterests : ['Top Stories', 'Politics', 'Business', 'Tech']
  );
  const [saving, setSaving] = useState(false);

  const toggleCategory = (cat: string) => {
    Haptics.selectionAsync();
    if (selected.includes(cat)) {
      if (selected.length > 1) {
        setSelected(selected.filter((c) => c !== cat));
      }
    } else {
      setSelected([...selected, cat]);
    }
  };

  const handleFinish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);

    setSelectedInterests(selected);
    setHasSelectedInterests(true);

    if (user && !isGuest) {
      try {
        await syncUserProfileToFirestore(user, selected);
      } catch (e) {
        console.warn('Could not sync interests to Firestore', e);
      }
    }

    setSaving(false);
    navigation.replace('MainTabs');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 12,
        },
      ]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <DigestlyLogo size="sm" />
          <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 8 }]}>
            {selected.length} Selected
          </Text>
        </View>

        <Text style={[typography.h1, styles.title, { color: colors.textPrimary }]}>
          Curate Your Radar
        </Text>
        <Text style={[typography.body, styles.subtitle, { color: colors.textSecondary }]}>
          Choose topics to prioritize in your personal feed. You can adjust these anytime in Settings.
        </Text>
      </View>

      {/* Categories Grid */}
      <ScrollView
        contentContainerStyle={styles.scrollGrid}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {ALL_CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat.name);
            return (
              <TouchableOpacity
                key={cat.name}
                activeOpacity={0.8}
                onPress={() => toggleCategory(cat.name)}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? '#1E293B'
                        : '#EFF6FF'
                      : colors.surface,
                    borderColor: isSelected
                      ? colors.accentBlue
                      : colors.border,
                  },
                ]}
              >
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? '#2563EB33'
                            : '#DBEAFE'
                          : colors.surfaceSubtle,
                      },
                    ]}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={18}
                      color={isSelected ? colors.accentBlue : colors.textSecondary}
                    />
                  </View>

                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={isSelected ? colors.accentBlue : colors.border}
                  />
                </View>

                <Text
                  style={[
                    typography.h4,
                    styles.catName,
                    {
                      color: isSelected ? colors.textPrimary : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {cat.name}
                </Text>

                <Text
                  numberOfLines={2}
                  style={[
                    typography.caption,
                    styles.catDesc,
                    { color: colors.textTertiary },
                  ]}
                >
                  {cat.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Bottom Confirm Bar */}
      <View style={[styles.bottomBar, { borderTopColor: colors.borderLight }]}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleFinish}
          disabled={saving || selected.length === 0}
          style={[
            styles.confirmBtn,
            {
              backgroundColor: colors.accent,
              opacity: selected.length === 0 ? 0.6 : 1,
            },
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color={isDark ? '#0B0E14' : '#FFFFFF'} />
          ) : (
            <Text style={[typography.button, { color: isDark ? '#0B0E14' : '#FFFFFF' }]}>
              Enter Digestly →
            </Text>
          )}
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtitle: {
    lineHeight: 19,
  },
  scrollGrid: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48.5%',
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 12,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: 13.5,
    marginBottom: 3,
  },
  catDesc: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  confirmBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
