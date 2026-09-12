import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import {
  GOOGLE_CONFIG,
  signInWithGoogleTokens,
  syncUserProfileToFirestore,
  auth,
} from '../services/firebase';

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const setUser = useAppStore((state) => state.setUser);
  const setHasCompletedOnboarding = useAppStore((state) => state.setHasCompletedOnboarding);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Configure Expo Google Auth Request
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CONFIG.webClientId,
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
      setErrorMessage(response.error?.message || 'Google sign in failed');
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
      setHasCompletedOnboarding(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('Interests');
    } catch (err: any) {
      console.error('Firebase Google Auth Error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = async () => {
    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!request) {
      // In development or environments where proxy request hasn't ready
      Alert.alert(
        'Connecting to Google',
        'Google Auth Session is initializing. If you are running in Expo Go or Simulator without Google Services, you can also use Instant Sign-In below to explore.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setLoading(true);
      await promptAsync();
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Could not launch Google Sign In');
    }
  };

  // Demo Sign-In for testing environments (Simulators / CI without Google Play Services)
  const handleQuickDemoSignIn = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const demoProfile = await syncUserProfileToFirestore({
        uid: 'demo-user-pakistan',
        displayName: 'Ahmad Khan',
        email: 'ahmad.khan@digestly.app',
        photoURL: null,
      });

      setUser(demoProfile);
      setHasCompletedOnboarding(true);
      navigation.replace('Interests');
    } catch (e) {
      setUser({
        uid: 'demo-user-pakistan',
        displayName: 'Ahmad Khan',
        email: 'ahmad.khan@digestly.app',
        photoURL: null,
        interests: ['Politics', 'Tech', 'Business'],
        notificationPrefs: { breaking: true, politics: true, tech: true },
      });
      setHasCompletedOnboarding(true);
      navigation.replace('Interests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} />

      <View style={styles.content}>
        {/* Brand Emblem */}
        <View style={[styles.emblemContainer, { backgroundColor: colors.accentSubtle }]}>
          <Text style={[styles.emblemUrdu, { color: colors.accent }]}>مختصر</Text>
        </View>

        <Text style={[typography.h1, styles.title, { color: colors.textPrimary }]}>
          Enter Digestly
        </Text>

        <Text style={[typography.body, styles.subtitle, { color: colors.textSecondary }]}>
          Distilled Pakistani journalism from Dawn, The Express Tribune, and Geo News powered by Groq AI.
        </Text>

        {/* Feature Highlights */}
        <View
          style={[
            styles.featuresCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: colors.accentSubtle }]}>
              <Ionicons name="flash" size={16} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h4, { color: colors.textPrimary }]}>3-Line Summaries</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
                Groq AI distills 1,000+ words into 3 essential takeaways
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: colors.accentSubtle }]}>
              <Ionicons name="git-network" size={16} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h4, { color: colors.textPrimary }]}>Multi-Source Radar</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
                Compare Dawn, Tribune & Geo angles side-by-side
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: colors.accentSubtle }]}>
              <Ionicons name="cloud-done" size={16} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h4, { color: colors.textPrimary }]}>Cloud Sync</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
                Saved stories and reading preferences synced across devices
              </Text>
            </View>
          </View>
        </View>

        {/* Error message if any */}
        {errorMessage && (
          <View style={[styles.errorBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={[typography.bodySmall, { color: '#DC2626', flex: 1 }]}>
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Google Sign-In Button */}
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
              <Ionicons name="logo-google" size={20} color="#EA4335" style={{ marginRight: 12 }} />
              <Text style={[typography.button, { color: colors.textPrimary }]}>
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Quick Demo Sign In for Testing / Simulators */}
        <TouchableOpacity
          onPress={handleQuickDemoSignIn}
          disabled={loading}
          style={styles.demoLink}
        >
          <Text style={[typography.bodySmall, { color: colors.accent, fontWeight: '600' }]}>
            Quick Sign-In (Simulator Demo) →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Subtle Studio Xenos attribution */}
      <View style={styles.footer}>
        <Text style={[typography.caption, styles.disclaimer, { color: colors.textTertiary }]}>
          Digestly connects securely to Firebase Auth. Your personal data is never sold.
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 6, letterSpacing: 0.3 }]}>
          Made by Studio Xenos
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emblemContainer: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emblemUrdu: {
    fontSize: 26,
    fontWeight: '700',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  featuresCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  googleButton: {
    width: '100%',
    height: 54,
    borderRadius: 14,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  demoLink: {
    marginTop: 18,
    paddingVertical: 6,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  disclaimer: {
    textAlign: 'center',
    lineHeight: 16,
  },
});
