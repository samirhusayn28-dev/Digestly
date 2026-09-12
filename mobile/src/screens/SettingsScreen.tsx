import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
} from 'react-native';
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
  { id: 'tech', label: 'Technology', icon: 'hardware-chip' },
  { id: 'sports', label: 'Sports', icon: 'trophy' },
];

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, typography, isDark } = useTheme();
  const themeMode = useAppStore((state) => state.themeMode);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const setHasSelectedInterests = useAppStore((state) => state.setHasSelectedInterests);
  const selectedInterests = useAppStore((state) => state.selectedInterests);

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
    // Request push notification permissions and save token
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
      'A test breaking alert was scheduled. If app is in foreground or background, check your notification shade.',
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
            setHasSelectedInterests(false);
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View
          style={[
            styles.profileCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {user?.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={styles.avatarImage}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: colors.accentSubtle }]}>
              <Text style={[styles.avatarInitial, { color: colors.accent }]}>
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'D'}
              </Text>
            </View>
          )}

          <View style={styles.profileInfo}>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>
              {user?.displayName || 'Digestly Reader'}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
              {user?.email || 'Logged in via Google'}
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('Interests')}
              style={styles.interestsRow}
            >
              <Text style={[typography.caption, { color: colors.accent, fontWeight: '600' }]}>
                {selectedInterests.length} topics selected • Customize
              </Text>
              <Ionicons name="chevron-forward" size={12} color={colors.accent} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Appearance */}
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
                size={20}
                color={colors.accent}
                style={{ marginRight: 12 }}
              />
              <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
                Dark Mode
              </Text>
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

        {/* Section: Category Push Notifications */}
        <View style={styles.section}>
          <Text style={[typography.badge, styles.sectionTitle, { color: colors.textTertiary }]}>
            Push Notifications
          </Text>

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
                    size={18}
                    color={colors.textSecondary}
                    style={{ marginRight: 12 }}
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
            <Ionicons name="notifications-outline" size={17} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={[typography.button, { color: colors.accent, fontSize: 13.5 }]}>
              Trigger Test Breaking Alert
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section: Account & Logout */}
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogout}
            style={[
              styles.logoutButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="log-out" size={20} color="#EF4444" style={{ marginRight: 10 }} />
            <Text style={[typography.button, { color: '#EF4444' }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Studio Xenos maker attribution credit */}
        <View style={styles.aboutSection}>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            Digestly v1.0.0
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4, letterSpacing: 0.3 }]}>
            Made by Studio Xenos
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 14,
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  interestsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 10,
    marginLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  groupedCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  groupedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testNotifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
  },
  aboutSection: {
    alignItems: 'center',
    marginTop: 12,
  },
});
