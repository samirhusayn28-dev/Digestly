import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { syncUserProfileToFirestore } from '../services/firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'Interests'>;

interface CategoryItem {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  desc: string;
}

const categories: CategoryItem[] = [
  { name: 'Politics', icon: 'shield-checkmark', desc: 'Government, policies, elections & diplomacy' },
  { name: 'Business', icon: 'trending-up', desc: 'Economy, PSX, rupee, inflation & markets' },
  { name: 'Tech', icon: 'hardware-chip', desc: 'Startups, AI, telecom & digital Pakistan' },
  { name: 'Sports', icon: 'trophy', desc: 'Cricket, PCB, PSL, squash & international' },
  { name: 'World', icon: 'globe', desc: 'Global affairs, geopolitics & South Asia' },
  { name: 'Entertainment', icon: 'film', desc: 'Culture, cinema, drama & arts' },
];

export const InterestsScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const user = useAppStore((state) => state.user);
  const selectedInterests = useAppStore((state) => state.selectedInterests);
  const setSelectedInterests = useAppStore((state) => state.setSelectedInterests);
  const setHasSelectedInterests = useAppStore((state) => state.setHasSelectedInterests);

  const [selected, setSelected] = useState<string[]>(
    user?.interests && user.interests.length > 0 ? user.interests : selectedInterests
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    try {
      if (user) {
        await syncUserProfileToFirestore(user, selected, user.notificationPrefs);
      }
    } catch (e) {
      console.warn('Could not sync interests to Firestore immediately', e);
    } finally {
      setSelectedInterests(selected);
      setHasSelectedInterests(true);
      setSaving(false);
      navigation.replace('MainTabs');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} />

      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: colors.accentSubtle }]}>
          <Text style={[typography.badge, { color: colors.accent }]}>Personalization</Text>
        </View>
        <Text style={[typography.h1, styles.title, { color: colors.textPrimary }]}>
          What matters to you?
        </Text>
        <Text style={[typography.body, styles.subtitle, { color: colors.textSecondary }]}>
          Select the topics you want prioritized in your daily radar. Your feed will reorganize around these themes.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {categories.map((cat) => {
          const isSelected = selected.includes(cat.name);

          return (
            <TouchableOpacity
              key={cat.name}
              activeOpacity={0.8}
              onPress={() => toggleCategory(cat.name)}
              style={[
                styles.card,
                {
                  backgroundColor: isSelected ? colors.surfaceElevated : colors.surface,
                  borderColor: isSelected ? colors.accent : colors.border,
                },
              ]}
            >
              <View style={styles.cardLeft}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isSelected ? colors.accentSubtle : colors.surfaceSubtle,
                    },
                  ]}
                >
                  <Ionicons
                    name={cat.icon}
                    size={24}
                    color={isSelected ? colors.accent : colors.textSecondary}
                  />
                </View>

                <View style={styles.cardTexts}>
                  <Text style={[typography.h3, { color: colors.textPrimary }]}>{cat.name}</Text>
                  <Text
                    style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}
                  >
                    {cat.desc}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: isSelected ? colors.accent : colors.border,
                    backgroundColor: isSelected ? colors.accent : 'transparent',
                  },
                ]}
              >
                {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleFinish}
          disabled={saving}
          style={[
            styles.continueButton,
            { backgroundColor: colors.accent, opacity: saving ? 0.7 : 1 },
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[typography.button, { color: '#FFFFFF' }]}>
              Enter Digestly ({selected.length} Selected)
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 22,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardTexts: {
    flex: 1,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  continueButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
