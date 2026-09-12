import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { DigestlyLogo } from '../components/common/DigestlyLogo';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, typography, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const hasSelectedInterests = useAppStore((state) => state.hasSelectedInterests);
  const isGuest = useAppStore((state) => state.isGuest);
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const hasSeenFreshSplash = useAppStore((state) => state.hasSeenFreshSplash);
  const setHasSeenFreshSplash = useAppStore((state) => state.setHasSeenFreshSplash);

  // Animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textFillProgress = useSharedValue(0);
  const footerOpacity = useSharedValue(0);

  const neutralColor = isDark ? '#334155' : '#CBD5E1';

  useEffect(() => {
    // If returning user who has completed onboarding/guest mode, route to MainTabs immediately
    if (hasCompletedOnboarding || isGuest) {
      navigation.replace('MainTabs');
      return;
    }

    // Fresh install animations
    logoOpacity.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.ease) });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 120 });
    textOpacity.value = withDelay(150, withTiming(1, { duration: 400 }));
    textFillProgress.value = withDelay(
      350,
      withTiming(1, { duration: 950, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    );
    footerOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));

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
          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            interests: user?.interests || ['Top Stories', 'Politics', 'Tech', 'Business'],
            notificationPrefs: user?.notificationPrefs || { breaking: true },
          });
        }
      }
    });

    const timer = setTimeout(() => {
      if (isNavigated) return;
      isNavigated = true;
      setHasSeenFreshSplash(true);

      if (!hasCompletedOnboarding && !isGuest) {
        navigation.replace('Onboarding');
      } else if (!auth.currentUser && !user && !isGuest) {
        navigation.replace('Login');
      } else if (!hasSelectedInterests && !isGuest) {
        navigation.replace('Interests');
      } else {
        navigation.replace('MainTabs');
      }
    }, 1600);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [hasCompletedOnboarding, hasSelectedInterests, isGuest, user, navigation, setHasSeenFreshSplash]);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const animatedTextFillStyle = useAnimatedStyle(() => ({
    width: `${textFillProgress.value * 100}%`,
  }));

  const animatedFooterStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.centerContent}>
        {/* Geometric Editorial "D" Mark */}
        <Animated.View style={animatedLogoStyle}>
          <DigestlyLogo size="xl" />
        </Animated.View>

        {/* Clean Editorial Title with Left-to-Right Color Sweep */}
        <Animated.View style={[styles.textBlock, animatedTextStyle]}>
          <View style={styles.wordmarkStack}>
            {/* Base neutral unfilled/outline layer */}
            <Text
              style={[
                typography.display,
                styles.title,
                { color: neutralColor, width: 220 },
              ]}
              numberOfLines={1}
            >
              Digestly
            </Text>

            {/* Overlaid progressive color fill sweep */}
            <Animated.View style={[styles.fillMask, animatedTextFillStyle]}>
              <Text
                style={[
                  typography.display,
                  styles.title,
                  { color: colors.accent, width: 220 },
                ]}
                numberOfLines={1}
              >
                Digestly
              </Text>
            </Animated.View>
          </View>

          <Text style={[typography.body, styles.tagline, { color: colors.textSecondary }]}>
            Modern News Briefing
          </Text>
        </Animated.View>
      </View>

      {/* Subtle maker credit line as mandated */}
      <Animated.View style={[styles.footer, animatedFooterStyle]}>
        <Text style={[typography.caption, { color: colors.textTertiary, letterSpacing: 0.3 }]}>
          Made by Studio Xenos
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 18,
  },
  title: {
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  wordmarkStack: {
    position: 'relative',
    height: 52,
    width: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fillMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  tagline: {
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  footer: {
    alignItems: 'center',
  },
});
