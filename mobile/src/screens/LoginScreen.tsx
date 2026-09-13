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
          'Google Sign-In is configured. If using a development build or custom OAuth consent, make sure your test account is enabled. You can immediately continue as Guest!'
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
        setErrorMessage(
          'Google Cloud OAuth is verifying your Android fingerprint. You can tap "Continue as Guest" below for full instant access!'
        );
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(
        'Google Sign In service initiated. If prompt does not appear, continue as Guest.'
      );
    }
  };

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
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom + 12,
        },
      ]}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Masthead & App Name */}
        <View style={styles.topMasthead}>
          <View style={styles.brandRow}>
            <DigestlyLogo size="sm" />
            <Text style={styles.brandName}>Digestly</Text>
          </View>
          <Text style={styles.regionTracked}>PAKISTAN • REGION • THE WORLD</Text>
          <Text style={styles.radarItalic}>The intelligent news radar</Text>
        </View>

        {/* Hero Title */}
        <View style={styles.heroTitleBox}>
          <Text style={styles.headline}>
            News beyond{'\n'}
            <Text style={styles.headlineAccent}>headlines.</Text>
          </Text>
          <Text style={styles.subheadline}>
            AI-distilled editorial briefings from Pakistan’s most trusted publications and global wires.
          </Text>
        </View>

        {/* Fanned Card Deck Preview */}
        <View style={styles.cardDeckContainer}>
          <View style={[styles.deckCard, styles.deckCardBackLeft]}>
            <Text style={styles.deckCardSource}>THE EXPRESS TRIBUNE</Text>
            <Text style={styles.deckCardTitle} numberOfLines={2}>
              State Bank maintains monetary pause amid steady disinflation...
            </Text>
          </View>
          <View style={[styles.deckCard, styles.deckCardBackRight]}>
            <Text style={styles.deckCardSource}>GEO NEWS</Text>
            <Text style={styles.deckCardTitle} numberOfLines={2}>
              PCB finalizes Qaddafi Stadium upgrades for Champions Trophy...
            </Text>
          </View>
          <View style={[styles.deckCard, styles.deckCardFront]}>
            <View style={styles.deckFrontHeader}>
              <View style={styles.liveDot} />
              <Text style={styles.deckFrontTag}>DAWN • BREAKING BRIEF</Text>
              <Text style={styles.deckFrontTime}>2m ago</Text>
            </View>
            <Text style={styles.deckFrontTitle}>
              Digital voting architecture ratified across joint parliamentary committee
            </Text>
            <View style={styles.deckFrontBullet}>
              <View style={styles.bulletDot} />
              <Text style={styles.deckFrontBulletText} numberOfLines={1}>
                Open-source cryptographic auditability mandated for future polls.
              </Text>
            </View>
          </View>
        </View>

        {/* 3 Feature Highlights Cards */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureRow}>
            <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Ionicons name="flash-outline" size={18} color="#38BDF8" />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>3-Line Fact Briefs</Text>
              <Text style={styles.featureSub}>High-density, neutral key points in under 30 seconds.</Text>
            </View>
          </View>

          <View style={styles.featureDivider} />

          <View style={styles.featureRow}>
            <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
              <Ionicons name="git-network-outline" size={18} color="#34D399" />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Multi-Source Radar</Text>
              <Text style={styles.featureSub}>Compare reporting from Dawn, Tribune, and Geo side-by-side.</Text>
            </View>
          </View>

          <View style={styles.featureDivider} />

          <View style={styles.featureRow}>
            <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
              <Ionicons name="globe-outline" size={18} color="#FBBF24" />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Bilingual Intelligence</Text>
              <Text style={styles.featureSub}>Instant high-fidelity translation in English and Urdu.</Text>
            </View>
          </View>
        </View>

        {/* Night Earth Visual Graphic with Pakistan Glow Pins */}
        <View style={styles.glowMapSection}>
          <View style={styles.mapGraphic}>
            <View style={styles.glowAura} />
            {/* Location pins */}
            <View style={[styles.pinWrapper, { top: 20, left: '38%' }]}>
              <View style={styles.pinGlow} />
              <View style={styles.pinCenter} />
              <Text style={styles.pinLabel}>Islamabad</Text>
            </View>
            <View style={[styles.pinWrapper, { top: 40, left: '60%' }]}>
              <View style={styles.pinGlow} />
              <View style={styles.pinCenter} />
              <Text style={styles.pinLabel}>Lahore</Text>
            </View>
            <View style={[styles.pinWrapper, { top: 75, left: '30%' }]}>
              <View style={styles.pinGlow} />
              <View style={styles.pinCenter} />
              <Text style={styles.pinLabel}>Karachi</Text>
            </View>
          </View>
        </View>

        {/* Editorial Quote Block */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteIcon}>“</Text>
          <Text style={styles.quoteText}>
            An indispensable tool for every informed citizen who values signal over noise.
          </Text>
        </View>

        {/* Error message if any */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="information-circle" size={16} color="#38BDF8" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Action Buttons: Solid White Google Pill & Outlined Guest Pill */}
        <View style={styles.actionsContainer}>
          {/* Continue with Google */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleGooglePress}
            disabled={loading}
            style={styles.googlePillButton}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#07090E" />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color="#EA4335" style={{ marginRight: 10 }} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Continue as Guest */}
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handleContinueAsGuest}
            disabled={loading}
            style={styles.guestPillButton}
          >
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Credit */}
        <View style={styles.footerWrap}>
          <Text style={styles.footerText}>Designed by Studio Xenos • Privacy & Terms</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 24,
    alignItems: 'center',
  },
  topMasthead: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  regionTracked: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 2.4,
    marginBottom: 4,
  },
  radarItalic: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#94A3B8',
  },
  heroTitleBox: {
    alignItems: 'center',
    marginBottom: 22,
  },
  headline: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  headlineAccent: {
    color: '#38BDF8',
  },
  subheadline: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 340,
  },
  cardDeckContainer: {
    height: 145,
    width: '100%',
    maxWidth: 360,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  deckCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  deckCardBackLeft: {
    position: 'absolute',
    width: '90%',
    height: 115,
    backgroundColor: '#0E131E',
    borderColor: '#1E2638',
    transform: [{ rotate: '-6deg' }, { translateY: -6 }],
    opacity: 0.65,
  },
  deckCardBackRight: {
    position: 'absolute',
    width: '90%',
    height: 115,
    backgroundColor: '#0E131E',
    borderColor: '#1E2638',
    transform: [{ rotate: '5deg' }, { translateY: -3 }],
    opacity: 0.75,
  },
  deckCardFront: {
    position: 'absolute',
    width: '98%',
    height: 125,
    backgroundColor: '#111622',
    borderColor: '#2A364F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  deckCardSource: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  deckCardTitle: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  deckFrontHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  deckFrontTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F87171',
    letterSpacing: 0.8,
    flex: 1,
  },
  deckFrontTime: {
    fontSize: 10,
    color: '#64748B',
  },
  deckFrontTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 18,
    marginBottom: 6,
  },
  deckFrontBullet: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#38BDF8',
    marginRight: 6,
  },
  deckFrontBulletText: {
    fontSize: 11,
    color: '#94A3B8',
    flex: 1,
  },
  featuresContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#111622',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E2638',
    padding: 14,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  featureDivider: {
    height: 1,
    backgroundColor: '#182030',
    marginVertical: 10,
  },
  glowMapSection: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    marginBottom: 16,
  },
  mapGraphic: {
    width: '100%',
    height: 110,
    borderRadius: 18,
    backgroundColor: '#0A0D15',
    borderWidth: 1,
    borderColor: '#151C2B',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  glowAura: {
    position: 'absolute',
    top: -20,
    left: '20%',
    width: 180,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },
  pinWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinGlow: {
    position: 'absolute',
    top: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(56, 189, 248, 0.35)',
  },
  pinCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  pinLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#E2E8F0',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  quoteCard: {
    width: '100%',
    maxWidth: 380,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(17, 22, 34, 0.6)',
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
    marginBottom: 20,
  },
  quoteIcon: {
    fontSize: 22,
    fontWeight: '800',
    color: '#38BDF8',
    lineHeight: 18,
  },
  quoteText: {
    fontSize: 12.5,
    fontStyle: 'italic',
    color: '#CBD5E1',
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#38BDF8',
    flex: 1,
    lineHeight: 16,
  },
  actionsContainer: {
    width: '100%',
    maxWidth: 380,
    gap: 10,
    marginBottom: 16,
  },
  googlePillButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#07090E',
    letterSpacing: 0.2,
  },
  guestPillButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#2A364F',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    letterSpacing: 0.2,
  },
  footerWrap: {
    paddingTop: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 0.2,
  },
});
