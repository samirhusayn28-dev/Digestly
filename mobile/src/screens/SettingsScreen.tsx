import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { signOutCurrentUser, syncUserProfileToFirestore } from '../services/firebase';
import { DigestlyLogo } from '../components/common/DigestlyLogo';
import {
  registerForPushNotificationsAsync,
  scheduleBreakingNewsNotification,
} from '../services/notifications';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Settings'>,
  NativeStackScreenProps<RootStackParamList>
>;

const NOTIFICATION_CATEGORIES = [
  { id: 'breaking', label: 'Breaking News Alerts', icon: 'flash' },
  { id: 'politics', label: 'Politics', icon: 'shield-checkmark' },
  { id: 'business', label: 'Business & Economy', icon: 'trending-up' },
  { id: 'tech', label: 'Technology & AI', icon: 'hardware-chip' },
  { id: 'sports', label: 'Sports', icon: 'trophy' },
];

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, typography, isDark } = useTheme();

  const themeMode = useAppStore((state) => state.themeMode);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const isGuest = useAppStore((state) => state.isGuest);
  const setIsGuest = useAppStore((state) => state.setIsGuest);
  const newsLanguage = useAppStore((state) => state.newsLanguage);
  const setNewsLanguage = useAppStore((state) => state.setNewsLanguage);
  const setHasSelectedInterests = useAppStore((state) => state.setHasSelectedInterests);
  const selectedInterests = useAppStore((state) => state.selectedInterests);

  const isTablet = width >= 768;

  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, boolean>>(
    user?.notificationPrefs || {
      breaking: true,
      politics: true,
      business: true,
      tech: true,
      sports: false,
    }
  );

  useEffect(() => {
    if (user?.uid) {
      registerForPushNotificationsAsync(user.uid);
    }
  }, [user?.uid]);

  const toggleNotification = async (id: string) => {
    Haptics.selectionAsync();
    const updated = { ...notificationPrefs, [id]: !notificationPrefs[id] };
    setNotificationPrefs(updated);

    if (user) {
      try {
        await syncUserProfileToFirestore(user, user.interests, updated);
      } catch (e) {
        console.warn('Could not sync notification preferences', e);
      }
    }
  };

  const handleTestNotification = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await scheduleBreakingNewsNotification(
      'SBP maintains policy rate at 11%',
      'Inflation reaches target band as currency stabilizes at 278/USD.',
      'Business',
      notificationPrefs
    );
    Alert.alert(
      'Notification Sent',
      'A test breaking alert was scheduled. Check your device notifications.',
      [{ text: 'OK' }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Digestly?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            try {
              await signOutCurrentUser();
            } catch (e) {
              console.warn('Sign out error', e);
            }
            setUser(null);
            setIsGuest(false);
            setHasSelectedInterests(false);
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <Text style={[typography.h1, { color: colors.textPrimary, letterSpacing: -0.4 }]}>
          Settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            maxWidth: isTablet ? 740 : '100%',
            alignSelf: 'center',
            width: '100%',
            paddingBottom: insets.bottom + 85,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Account */}
        <View style={styles.section}>
          <Text style={[typography.badge, styles.sectionTitle, { color: colors.textTertiary }]}>
            Account
          </Text>

          {user && !isGuest ? (
            <View
              style={[
                styles.profileCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {user.photoURL ? (
                <Image
                  source={{ uri: user.photoURL }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  transition={250}
                />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.accentSubtle }]}>
                  <Text style={[styles.avatarInitial, { color: colors.accent }]}>
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'D'}
                  </Text>
                </View>
              )}

              <View style={styles.profileInfo}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>
                  {user.displayName || 'Digestly Reader'}
                </Text>
                <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 1 }]}>
                  {user.email}
                </Text>
                <View style={styles.badgeAuthRow}>
                  <Ionicons name="checkmark-circle" size={13} color="#16A34A" />
                  <Text style={[typography.caption, { color: '#16A34A', marginLeft: 4, fontWeight: '600' }]}>
                    Synced with Google
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.profileCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={[styles.avatarFallback, { backgroundColor: colors.accentSubtle }]}>
                <Ionicons name="person-outline" size={24} color={colors.accent} />
              </View>

              <View style={styles.profileInfo}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>
                  Guest Reader
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  Bookmarks stored locally on this device.
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  style={styles.signInLink}
                >
                  <Text style={[typography.caption, { color: colors.accent, fontWeight: '700' }]}>
                    Sign in with Google to sync →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Section 2: News Preferences */}
        <View style={styles.section}>
          <Text style={[typography.badge, styles.sectionTitle, { color: colors.textTertiary }]}>
            News Preferences
          </Text>

          {/* News Content Language Toggle */}
          <View
            style={[
              styles.groupedCard,
              { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 12 },
            ]}
          >
            <View style={styles.languageCardContent}>
              <View style={styles.settingLabelRow}>
                <Ionicons name="language-outline" size={18} color={colors.accent} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}>
                    News Content Language
                  </Text>
                  <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 1 }]}>
                    Translates headlines & 3-line summaries
                  </Text>
                </View>
              </View>

              {/* EN vs Urdu Segmented Pill */}
              <View style={[styles.langSegment, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight }]}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setNewsLanguage('en');
                  }}
                  style={[
                    styles.langSegmentOption,
                    newsLanguage === 'en' && {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.badge,
                      {
                        color: newsLanguage === 'en' ? colors.textPrimary : colors.textTertiary,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    English
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setNewsLanguage('ur');
                  }}
                  style={[
                    styles.langSegmentOption,
                    newsLanguage === 'ur' && {
                      backgroundColor: colors.accent,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.badge,
                      {
                        color: newsLanguage === 'ur' ? (isDark ? '#000000' : '#FFFFFF') : colors.textTertiary,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    اردو (Urdu)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Curated Topics / Interests */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Interests')}
            style={[
              styles.settingRow,
              { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 12 },
            ]}
          >
            <View style={styles.settingLabelRow}>
              <Ionicons name="options-outline" size={18} color={colors.accent} style={{ marginRight: 10 }} />
              <View>
                <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
                  Curated Topics
                </Text>
                <Text style={[typography.caption, { color: colors.textTertiary }]}>
                  {selectedInterests.length} of 18 categories selected
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* Category Push Notifications */}
          <View
            style={[
              styles.groupedCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {NOTIFICATION_CATEGORIES.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.groupedRow,
                  index < NOTIFICATION_CATEGORIES.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderLight,
                  },
                ]}
              >
                <View style={styles.settingLabelRow}>
                  <Ionicons
                    name={item.icon as any}
                    size={17}
                    color={colors.textSecondary}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
                    {item.label}
                  </Text>
                </View>

                <Switch
                  value={notificationPrefs[item.id] ?? false}
                  onValueChange={() => toggleNotification(item.id)}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={'#FFFFFF'}
                />
              </View>
            ))}
          </View>

          {/* Test notification button */}
          <TouchableOpacity
            onPress={handleTestNotification}
            style={[styles.testNotifBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
          >
            <Ionicons name="notifications-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[typography.button, { color: colors.textPrimary, fontSize: 13 }]}>
              Trigger Test Breaking Alert
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section 3: Appearance */}
        <View style={styles.section}>
          <Text style={[typography.badge, styles.sectionTitle, { color: colors.textTertiary }]}>
            Appearance
          </Text>

          <View
            style={[
              styles.settingRow,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.settingLabelRow}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={18}
                color={colors.accent}
                style={{ marginRight: 10 }}
              />
              <View>
                <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
                  Dark Mode
                </Text>
                <Text style={[typography.caption, { color: colors.textTertiary }]}>
                  High contrast tuned for night reading
                </Text>
              </View>
            </View>

            <Switch
              value={isDark}
              onValueChange={(val) => {
                Haptics.selectionAsync();
                setThemeMode(val ? 'dark' : 'light');
              }}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={'#FFFFFF'}
            />
          </View>
        </View>

        {/* Section 4: Sign Out / Account Action */}
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogout}
            style={[
              styles.logoutButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={[typography.button, { color: '#EF4444' }]}>
              {user && !isGuest ? 'Sign Out' : 'Reset Session'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Maker Attribution & About Digestly */}
        <View style={styles.aboutSection}>
          <DigestlyLogo size="sm" />
          <Text style={[typography.badge, { color: colors.textPrimary, marginTop: 8, letterSpacing: 0.5 }]}>
            DIGESTLY v1.0.0
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 3, textAlign: 'center' }]}>
            Editorial news aggregator summarizing Dawn, The Express Tribune & Geo News
          </Text>
          <View style={[styles.makerTag, { backgroundColor: colors.surfaceSubtle }]}>
            <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '600', fontSize: 11 }]}>
              Made by Studio Xenos
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 8,
    marginLeft: 2,
    textTransform: 'uppercase',
    fontSize: 10.5,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  badgeAuthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  signInLink: {
    marginTop: 5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  groupedCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  languageCardContent: {
    padding: 12,
  },
  langSegment: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
    marginTop: 10,
  },
  langSegmentOption: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  testNotifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
  },
  aboutSection: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 16,
  },
  makerTag: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
