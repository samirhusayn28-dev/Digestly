import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import {
  GOOGLE_CONFIG,
  signInWithGoogleTokens,
  syncUserProfileToFirestore,
} from '../services/firebase';
import { DigestlyLogo } from '../components/common/DigestlyLogo';

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark } = useTheme();
  const setUser = useAppStore((state) => state.setUser);
  const setIsGuest = useAppStore((state) => state.setIsGuest);
  const setHasCompletedOnboarding = useAppStore((state) => state.setHasCompletedOnboarding);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Configure Expo Google Auth Request with ID Token for Firebase
  const redirectUri = makeRedirectUri({
    scheme: 'digestly',
  });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: Platform.select({
      ios: GOOGLE_CONFIG.iosClientId,
      android: GOOGLE_CONFIG.androidClientId,
      default: GOOGLE_CONFIG.webClientId,
    }),
    webClientId: GOOGLE_CONFIG.webClientId,
    iosClientId: GOOGLE_CONFIG.iosClientId,
    androidClientId: GOOGLE_CONFIG.androidClientId,
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token, access_token } = response.params;
      handleFirebaseAuthWithGoogle(id_token, access_token);
    } else if (response?.type === 'error') {
      setLoading(false);
      const err = response.error?.message || '';
      if (err.includes('WEB') || err.includes('Custom scheme') || err.includes('invalid_request')) {
        setErrorMessage(
          'Google Sign-In requires Android Client setup in Google Cloud Console. You can immediately continue as a Guest with all features enabled!'
        );
      } else {
        setErrorMessage(response.error?.message || 'Google Sign-In was cancelled or failed.');
      }
    } else if (response?.type === 'cancel' || response?.type === 'dismiss') {
      setLoading(false);
    }
  }, [response]);

  const handleFirebaseAuthWithGoogle = async (idToken?: string, accessToken?: string) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const firebaseUser = await signInWithGoogleTokens(idToken, accessToken);

      const profile = await syncUserProfileToFirestore({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
      });

      setUser(profile);
      setIsGuest(false);
      setHasCompletedOnboarding(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('Interests');
    } catch (err: any) {
      console.error('Firebase Google Auth Error:', err);
      setErrorMessage(err.message || 'Authentication failed. You can continue as a Guest.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = async () => {
    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      setLoading(true);
      const res = await promptAsync();
      if (res?.type === 'success') {
        const { id_token, access_token } = res.params;
        await handleFirebaseAuthWithGoogle(id_token, access_token);
      } else if (res?.type === 'error') {
        setLoading(false);
        const err = res.error?.message || '';
        if (err.includes('WEB') || err.includes('Custom scheme') || err.includes('invalid_request')) {
          setErrorMessage(
            'Google Sign-In is awaiting Google Cloud Console Android Client setup (com.digestly.app). Please continue as Guest!'
          );
        } else {
          setErrorMessage(res.error?.message || 'Google Sign-In failed.');
        }
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      setLoading(false);
      const msg = err.message || '';
      if (msg.includes('WEB') || msg.includes('Custom scheme') || msg.includes('invalid_request')) {
        setErrorMessage(
          'Google Sign-In requires Android Client setup in Google Cloud Console. Tap Continue as Guest below to proceed!'
        );
      } else {
        setErrorMessage(
          err.message || 'Could not launch Google Sign In. You can continue as a Guest.'
        );
      }
    }
  };

  // First-Class Guest Mode
  const handleContinueAsGuest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsGuest(true);
    setUser(null);
    setHasCompletedOnboarding(true);
    navigation.replace('Interests');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Brand Monogram */}
        <View style={styles.brandHeader}>
          <DigestlyLogo size="lg" />
          <Text style={[typography.h1, styles.title, { color: colors.textPrimary }]}>
            Welcome to Digestly
          </Text>
          <Text style={[typography.body, styles.subtitle, { color: colors.textSecondary }]}>
            High-bandwidth news intelligence from Pakistan’s leading publications.
          </Text>
        </View>

        {/* Value Prop Highlights */}
        <View
          style={[
            styles.featuresCard,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
          ]}
        >
          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: colors.surface }]}>
              <Ionicons name="flash-outline" size={16} color={colors.accentRed} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h4, { color: colors.textPrimary }]}>3-Line Fact Briefs</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 1 }]}>
                Groq AI extracts key data points without opinion or fluff
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: colors.surface }]}>
              <Ionicons name="git-network-outline" size={16} color={colors.accentBlue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h4, { color: colors.textPrimary }]}>Multi-Source Radar</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 1 }]}>
                Side-by-side coverage from Dawn, Express Tribune, and Geo
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: colors.surface }]}>
              <Ionicons name="globe-outline" size={16} color={colors.accentYellow} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h4, { color: colors.textPrimary }]}>Bilingual Intelligence</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 1 }]}>
                Instant toggle between English and Urdu news summaries
              </Text>
            </View>
          </View>
        </View>

        {/* Error message if any */}
        {errorMessage && (
          <View style={[styles.errorBox, { backgroundColor: isDark ? '#7F1D1D33' : '#FEF2F2' }]}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={[typography.bodySmall, { color: '#DC2626', flex: 1 }]}>
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Primary Action: Google Sign-In */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleGooglePress}
          disabled={loading}
          style={[
            styles.googleButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: loading ? 0.7 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color="#EA4335" style={{ marginRight: 10 }} />
              <Text style={[typography.button, { color: colors.textPrimary }]}>
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Secondary Action: Continue as Guest */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleContinueAsGuest}
          disabled={loading}
          style={[
            styles.guestButton,
            {
              backgroundColor: isDark ? colors.surface : '#F1F5F9',
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="person-outline"
            size={16}
            color={colors.textSecondary}
            style={{ marginRight: 8 }}
          />
          <Text style={[typography.button, { color: colors.textPrimary, fontSize: 13.5 }]}>
            Continue as Guest
          </Text>
        </TouchableOpacity>

        <Text style={[typography.caption, styles.guestHint, { color: colors.textTertiary }]}>
          Guest mode gives full access to dispatches, topics, and search without creating an account.
        </Text>
      </ScrollView>

      {/* Subtle Studio Xenos attribution */}
      <View style={styles.footer}>
        <Text style={[typography.caption, { color: colors.textTertiary, letterSpacing: 0.2 }]}>
          Made by Studio Xenos
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  featuresCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
    maxWidth: 420,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  featureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  googleButton: {
    width: '100%',
    maxWidth: 420,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 10,
  },
  guestButton: {
    width: '100%',
    maxWidth: 420,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestHint: {
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
    lineHeight: 15,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    alignItems: 'center',
  },
});
