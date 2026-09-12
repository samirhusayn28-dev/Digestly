import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { onAuthStateChanged } from 'firebase/auth';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { auth, syncUserProfileToFirestore } from '../services/firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const hasSelectedInterests = useAppStore((state) => state.hasSelectedInterests);
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  // Animations
  const logoScale = useSharedValue(0.7);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const footerOpacity = useSharedValue(0);

  useEffect(() => {
    // Start animations
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    textOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    footerOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));

    // Firebase Auth listener with timeout safety
    let isNavigated = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await syncUserProfileToFirestore({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
          });
          setUser(profile);
        } catch {
          // fallback if offline
          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            interests: user?.interests || ['Politics', 'Tech', 'Business'],
            notificationPrefs: user?.notificationPrefs || { breaking: true },
          });
        }
      }
    });

    const timer = setTimeout(() => {
      if (isNavigated) return;
      isNavigated = true;

      if (!hasCompletedOnboarding) {
        navigation.replace('Onboarding');
      } else if (!auth.currentUser && !user) {
        navigation.replace('Login');
      } else if (!hasSelectedInterests) {
        navigation.replace('Interests');
      } else {
        navigation.replace('MainTabs');
      }
    }, 1900);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [hasCompletedOnboarding, hasSelectedInterests, user, navigation]);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const animatedFooterStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} />

      <View style={styles.centerContent}>
        {/* Animated Brand Emblem */}
        <Animated.View
          style={[
            styles.badgeContainer,
            { backgroundColor: colors.accentSubtle },
            animatedLogoStyle,
          ]}
        >
          <Text style={[styles.urduText, { color: colors.accent }]}>مختصر</Text>
        </Animated.View>

        <Animated.View style={[styles.textBlock, animatedTextStyle]}>
          <Text style={[typography.display, styles.title, { color: colors.textPrimary }]}>
            Digestly
          </Text>

          <Text style={[typography.bodyMedium, styles.tagline, { color: colors.textSecondary }]}>
            Pakistan’s Stories, Distilled
          </Text>
        </Animated.View>
      </View>

      {/* Subtle maker credit line as mandated */}
      <Animated.View style={[styles.footer, animatedFooterStyle]}>
        <Text style={[typography.caption, { color: colors.textTertiary, letterSpacing: 0.4 }]}>
          Made by Studio Xenos
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  urduText: {
    fontSize: 32,
    fontWeight: '700',
  },
  textBlock: {
    alignItems: 'center',
  },
  title: {
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  footer: {
    paddingBottom: 16,
    alignItems: 'center',
  },
});
