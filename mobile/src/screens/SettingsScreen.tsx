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
import { DigestlyWordmark } from '../components/common/DigestlyWordmark';
import {
  registerForPushNotificationsAsync,
  scheduleBreakingNewsNotification,
} from '../services/notifications';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Settings'>,
  NativeStackScreenProps<RootStackParamList>
>;

interface CategoryPrefItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const CATEGORY_PREFS: CategoryPrefItem[] = [
  { id: 'Politics', label: 'Politics', icon: 'megaphone-outline', color: '#EF4444' },
  { id: 'Business & Economy', label: 'Business & Economy', icon: 'trending-up-outline', color: '#10B981' },
  { id: 'Technology & AI', label: 'Technology & AI', icon: 'hardware-chip-outline', color: '#38BDF8' },
  { id: 'Sports', label: 'Sports', icon: 'football-outline', color: '#F59E0B' },
  { id: 'World', label: 'World', icon: 'globe-outline', color: '#6366F1' },
  { id: 'Health', label: 'Health', icon: 'fitness-outline', color: '#14B8A6' },
  { id: 'Entertainment', label: 'Entertainment', icon: 'film-outline', color: '#EC4899' },
  { id: 'Education', label: 'Education', icon: 'school-outline', color: '#0EA5E9' },
  { id: 'Environment & Climate', label: 'Environment & Climate', icon: 'leaf-outline', color: '#84CC16' },
  { id: 'Science', label: 'Science', icon: 'flask-outline', color: '#8B5CF6' },
];

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, typography, isDark } = useTheme();

  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const isGuest = useAppStore((state) => state.isGuest);
  const setIsGuest = useAppStore((state) => state.setIsGuest);
  const newsLanguage = useAppStore((state) => state.newsLanguage);
  const setNewsLanguage = useAppStore((state) => state.setNewsLanguage);
  const setHasSelectedInterests = useAppStore((state) => state.setHasSelectedInterests);
  const selectedInterests = useAppStore((state) => state.selectedInterests);

  const isTablet = width >= 768;

  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {
      breaking: true,
      Politics: true,
      'Business & Economy': true,
      'Technology & AI': true,
      Sports: true,
      World: true,
      Health: true,
      Entertainment: true,
      Education: true,
      'Environment & Climate': true,
      Science: true,
    };
    if (user?.notificationPrefs) {
      return { ...initial, ...user.notificationPrefs };
    }
    return initial;
  });

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

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleToggleNotifications = async (enabled: boolean) => {
    Haptics.selectionAsync();
    setNotificationsEnabled(enabled);
    if (enabled) {
      const token = await registerForPushNotificationsAsync(user?.uid);
      if (token && user) {
        syncUserProfileToFirestore(user, selectedInterests, {
          ...notificationPrefs,
          notificationsEnabled: true,
        }).catch((e) => console.warn('Could not sync push notification pref:', e));
      }
    } else if (user) {
      syncUserProfileToFirestore(user, selectedInterests, {
        ...notificationPrefs,
        notificationsEnabled: false,
      }).catch((e) => console.warn('Could not sync push notification pref:', e));
    }
  };

  const handleLogout = () => {
    Alert.alert(
      user && !isGuest ? 'Sign Out' : 'Reset Session',
      user && !isGuest
        ? 'Are you sure you want to sign out of Digestly?'
        : 'This will reset your guest preferences and return to welcome screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: user && !isGuest ? 'Sign Out' : 'Reset',
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

      {/* Header with decorative Stay Informed crescent */}
      <View style={[styles.headerContainer, { borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerBadge, { color: colors.textTertiary }]}>
            SETTINGS
          </Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Settings
          </Text>
          <Text style={[styles.headerSubtext, { color: colors.textSecondary }]}>
            Customize your news experience.
          </Text>
        </View>

        {/* Decorative Top-Right Crescent / Globe with handwritten Stay Informed */}
        <View style={styles.headerRightGraphic}>
          <View style={[styles.crescentOuter, { borderColor: isDark ? '#1E2638' : '#E2E8F0' }]}>
            <View style={[styles.crescentInner, { backgroundColor: isDark ? '#0D111A' : '#F1F5F9' }]}>
              <Ionicons name="moon" size={16} color={isDark ? '#F8FAFC' : '#0F172A'} />
            </View>
          </View>
          <Text style={[styles.stayInformedText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Stay Informed
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            maxWidth: isTablet ? 740 : '100%',
            alignSelf: 'center',
            width: '100%',
            paddingBottom: insets.bottom + 95,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1: ACCOUNT */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.textTertiary }]}>
            ACCOUNT
          </Text>

          {user && !isGuest ? (
            <View style={[styles.accountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.accountTopRow}>
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

                <View style={styles.accountInfo}>
                  <Text style={[styles.accountName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {user.displayName || 'Digestly Reader'}
                  </Text>
                  <Text style={[styles.accountEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>
              </View>

              <View style={[styles.syncStatusRow, { borderTopColor: colors.borderLight }]}>
                <Ionicons name="cloud-done-outline" size={16} color="#10B981" />
                <Text style={[styles.syncStatusText, { color: '#10B981' }]}>
                  Bookmarks & interests synced with Google
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.accountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.accountTopRow}>
                <View style={[styles.avatarFallback, { backgroundColor: isDark ? '#182030' : '#E2E8F0' }]}>
                  <Ionicons name="person-outline" size={24} color={colors.textSecondary} />
                </View>

                <View style={styles.accountInfo}>
                  <Text style={[styles.accountName, { color: colors.textPrimary }]}>
                    Guest Reader
                  </Text>
                  <Text style={[styles.accountEmail, { color: colors.textTertiary }]}>
                    Bookmarks stored locally on this device.
                  </Text>
                </View>
              </View>

              {/* Cloud notice */}
              <View style={styles.cloudNoticeRow}>
                <Ionicons name="cloud-outline" size={15} color={colors.textTertiary} style={{ marginRight: 6 }} />
                <Text style={[styles.cloudNoticeText, { color: colors.textSecondary }]}>
                  Sign in with Google to sync across devices and keep your bookmarks safe.
                </Text>
              </View>

              {/* Solid White Google Sign-in Button */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  navigation.navigate('Login');
                }}
                style={styles.googleSignInButton}
              >
                <Ionicons name="logo-google" size={18} color="#000000" style={{ marginRight: 8 }} />
                <Text style={styles.googleSignInText}>
                  Sign in with Google
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* SECTION 2: PREFERENCES */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.textTertiary }]}>
            PREFERENCES
          </Text>

          {/* News Content Language Segmented Card */}
          <View style={[styles.prefCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.prefCardHeader}>
              <View style={[styles.prefIconBox, { backgroundColor: isDark ? '#182030' : '#F1F5F9' }]}>
                <Ionicons name="language-outline" size={18} color={colors.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.prefTitle, { color: colors.textPrimary }]}>
                  News Content Language
                </Text>
                <Text style={[styles.prefSubtitle, { color: colors.textTertiary }]}>
                  Translates headlines & 3-line summaries
                </Text>
              </View>
            </View>

            {/* Segmented Control [ ENGLISH | اردو ] */}
            <View style={[styles.langSegmentControl, { backgroundColor: isDark ? '#0D111A' : '#F8FAFC', borderColor: colors.borderLight }]}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  Haptics.selectionAsync();
                  setNewsLanguage('en');
                }}
                style={[
                  styles.langSegmentBtn,
                  newsLanguage === 'en' && {
                    backgroundColor: isDark ? '#F8FAFC' : '#0F172A',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.15,
                    shadowRadius: 2,
                    elevation: 2,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.langSegmentText,
                    {
                      color: newsLanguage === 'en'
                        ? (isDark ? '#07090E' : '#FFFFFF')
                        : colors.textTertiary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  ENGLISH
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  Haptics.selectionAsync();
                  setNewsLanguage('ur');
                }}
                style={[
                  styles.langSegmentBtn,
                  newsLanguage === 'ur' && {
                    backgroundColor: isDark ? '#F8FAFC' : '#0F172A',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.15,
                    shadowRadius: 2,
                    elevation: 2,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.langSegmentText,
                    {
                      color: newsLanguage === 'ur'
                        ? (isDark ? '#07090E' : '#FFFFFF')
                        : colors.textTertiary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  اردو (URDU)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Curated Topics Row */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.navigate('Interests');
            }}
            style={[styles.clickableRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.clickableRowLeft}>
              <View style={[styles.prefIconBox, { backgroundColor: isDark ? '#182030' : '#F1F5F9' }]}>
                <Ionicons name="sparkles-outline" size={17} color={colors.textPrimary} />
              </View>
              <View>
                <Text style={[styles.prefTitle, { color: colors.textPrimary }]}>
                  Curated Topics
                </Text>
                <Text style={[styles.prefSubtitle, { color: colors.textTertiary }]}>
                  {selectedInterests.length > 0 ? `${selectedInterests.length} of 10 selected` : '10 of 10 active'}
                </Text>
              </View>
            </View>
            <View style={styles.clickableRowRight}>
              <Text style={[styles.activePillBadge, { color: colors.textSecondary }]}>
                {selectedInterests.length > 0 ? `${selectedInterests.length} active` : 'All 10 active'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>

          {/* 10 Category Switch Rows with Colored Icon Badges */}
          <View style={[styles.categoryListCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {CATEGORY_PREFS.map((cat, idx) => {
              const isEnabled = notificationPrefs[cat.id] ?? true;
              return (
                <View
                  key={cat.id}
                  style={[
                    styles.categoryRow,
                    idx < CATEGORY_PREFS.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.borderLight,
                    },
                  ]}
                >
                  <View style={styles.categoryRowLeft}>
                    <View style={[styles.categoryIconBadge, { backgroundColor: cat.color + '22' }]}>
                      <Ionicons name={cat.icon} size={15} color={cat.color} />
                    </View>
                    <Text style={[styles.categoryLabel, { color: colors.textPrimary }]}>
                      {cat.label}
                    </Text>
                  </View>

                  <Switch
                    value={isEnabled}
                    onValueChange={() => toggleNotification(cat.id)}
                    trackColor={{ false: isDark ? '#1E2638' : '#E2E8F0', true: isDark ? '#F8FAFC' : '#0F172A' }}
                    thumbColor={isEnabled ? (isDark ? '#07090E' : '#FFFFFF') : '#94A3B8'}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* SECTION 3: SYSTEM & ALERTS */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.textTertiary }]}>
            SYSTEM & ALERTS
          </Text>

          {/* Simple Notifications On/Off Toggle */}
          <View style={[styles.clickableRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.clickableRowLeft}>
              <View style={[styles.prefIconBox, { backgroundColor: '#182030' }]}>
                <Ionicons name="notifications-outline" size={18} color="#38BDF8" />
              </View>
              <View>
                <Text style={[styles.prefTitle, { color: colors.textPrimary }]}>
                  Notifications
                </Text>
                <Text style={[styles.prefSubtitle, { color: colors.textTertiary }]}>
                  Real-time alerts when new digests are published
                </Text>
              </View>
            </View>

            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#1E2638', true: '#38BDF8' }}
              thumbColor={notificationsEnabled ? '#FFFFFF' : '#64748B'}
            />
          </View>
        </View>

        {/* SECTION 4: RESET / LOGOUT */}
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogout}
            style={[styles.logoutBtn, { backgroundColor: isDark ? '#161214' : '#FEF2F2', borderColor: isDark ? '#3A1E24' : '#FECACA' }]}
          >
            <Ionicons name="log-out-outline" size={17} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={[styles.logoutText, { color: '#EF4444' }]}>
              {user && !isGuest ? 'Sign Out' : 'Reset Session'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 5: FOOTER ATTRIBUTION */}
        <View style={styles.footerContainer}>
          <DigestlyWordmark size="md" />
          <Text style={[styles.appVersion, { color: colors.textPrimary }]}>
            DIGESTLY v1.3.0
          </Text>
          <Text style={[styles.appDescription, { color: colors.textTertiary }]}>
            Editorial news aggregator summarizing Dawn, The Express Tribune, Geo News, BBC World & Al Jazeera
          </Text>
          <View style={[styles.makerPill, { backgroundColor: isDark ? '#111622' : '#F1F5F9', borderColor: colors.border }]}>
            <Text style={[styles.makerText, { color: colors.textSecondary }]}>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerBadge: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtext: {
    fontSize: 13,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  headerRightGraphic: {
    alignItems: 'center',
    marginLeft: 12,
  },
  crescentOuter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  crescentInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stayInformedText: {
    fontSize: 10,
    fontStyle: 'italic',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeading: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  accountCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  accountTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '800',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  accountEmail: {
    fontSize: 12.5,
    marginTop: 2,
  },
  cloudNoticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
  cloudNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  googleSignInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 44,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  googleSignInText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  syncStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  prefCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  prefCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  prefIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  prefTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  prefSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
  },
  langSegmentControl: {
    flexDirection: 'row',
    borderRadius: 9,
    borderWidth: 1,
    padding: 3,
  },
  langSegmentBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langSegmentText: {
    fontSize: 11.5,
    letterSpacing: 0.6,
  },
  clickableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  clickableRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clickableRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activePillBadge: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  categoryListCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  categoryLabel: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 4,
  },
  appVersion: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 8,
  },
  appDescription: {
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
    lineHeight: 16,
  },
  makerPill: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  makerText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
