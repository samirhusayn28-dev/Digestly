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
import * as AuthSession from 'expo-auth-session';
import { ResponseType } from 'expo-auth-session';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { RootStackParamList } from '../navigation/types';
import { useAppStore, UserProfile } from '../store/useAppStore';
import {
  GOOGLE_CONFIG,
  signInWithGoogleTokens,
  syncUserProfileToFirestore,
} from '../services/firebase';
import { DigestlyWordmark } from '../components/common/DigestlyWordmark';

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// Tested mobile OAuth client ID with reverse custom scheme
const GOOGLE_MOBILE_CLIENT_ID = '331798617464-q6l7vvrdml02as6buf5nsp2sh7i1le4d.apps.googleusercontent.com';
const GOOGLE_MOBILE_REDIRECT_URI = 'com.googleusercontent.apps.331798617464-q6l7vvrdml02as6buf5nsp2sh7i1le4d:/oauthredirect';

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const setUser = useAppStore((state) => state.setUser);
  const setIsGuest = useAppStore((state) => state.setIsGuest);
  const setHasCompletedOnboarding = useAppStore((state) => state.setHasCompletedOnboarding);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Configure Google Auth Request using the validated mobile client ID & scheme
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_MOBILE_CLIENT_ID,
    iosClientId: GOOGLE_MOBILE_CLIENT_ID,
    androidClientId: GOOGLE_MOBILE_CLIENT_ID,
    redirectUri: GOOGLE_MOBILE_REDIRECT_URI,
    scopes: ['openid', 'profile', 'email'],
    responseType: ResponseType.Code,
  });

  const completeUserSignIn = async (idToken?: string, accessToken?: string) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      console.log('[GoogleAuth] Completing user sign in... idToken present:', !!idToken, 'accessToken present:', !!accessToken);

      let signedInProfile: UserProfile | null = null;

      // 1. Attempt Firebase Auth sign-in with Google Credential
      if (idToken || accessToken) {
        try {
          console.log('[GoogleAuth] Calling signInWithGoogleTokens in Firebase...');
          const firebaseUser = await signInWithGoogleTokens(idToken, accessToken);
          console.log('[GoogleAuth] Firebase auth succeeded! User UID:', firebaseUser.uid);

          signedInProfile = await syncUserProfileToFirestore({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
          });
          console.log('[GoogleAuth] Synced Firestore profile:', signedInProfile.displayName, signedInProfile.email);
        } catch (fbErr: any) {
          console.warn('[GoogleAuth] Firebase signInWithGoogleTokens error:', fbErr?.message || fbErr);
        }
      }

      // 2. Fallback: Directly fetch Google user info if Firebase sign-in did not return profile
      if (!signedInProfile && accessToken) {
        try {
          console.log('[GoogleAuth] Fetching user info directly from Google OAuth API...');
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (userInfoRes.ok) {
            const googleData = await userInfoRes.json();
            console.log('[GoogleAuth] Retrieved Google profile data:', googleData.email);
            signedInProfile = {
              uid: googleData.sub || `google_${Date.now()}`,
              displayName: googleData.name || googleData.given_name || 'Google Reader',
              email: googleData.email || null,
              photoURL: googleData.picture || null,
              interests: ['Top Stories', 'Politics', 'Tech', 'Business'],
              notificationPrefs: { breaking: true, politics: true, tech: true },
            };
          } else {
            const errBody = await userInfoRes.text();
            console.warn('[GoogleAuth] Google userinfo returned status', userInfoRes.status, errBody);
          }
        } catch (fetchErr: any) {
          console.warn('[GoogleAuth] Error fetching Google userinfo:', fetchErr);
        }
      }

      if (signedInProfile) {
        console.log('[GoogleAuth] User is now registered as logged in! Updating store and navigating to MainTabs...');
        setUser(signedInProfile);
        setIsGuest(false);
        setHasCompletedOnboarding(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace('MainTabs');
      } else {
        throw new Error('Could not retrieve credentials from Google. Please try again or continue as Guest.');
      }
    } catch (err: any) {
      console.error('[GoogleAuth] Login failed with error:', err);
      setErrorMessage(err.message || 'Google Sign-In could not complete. You can continue as Guest.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('[GoogleAuth] Starting Google Sign-In prompt...');

    try {
      const authResult = await promptAsync();
      console.log('[GoogleAuth] promptAsync returned result type:', authResult?.type);

      if (authResult?.type === 'success') {
        const { code, id_token: paramIdToken, access_token: paramAccessToken } = authResult.params;
        let idToken: string | undefined = paramIdToken;
        let accessToken: string | undefined = paramAccessToken;

        if (!idToken && !accessToken && code) {
          console.log('[GoogleAuth] Authorization code received. Exchanging for tokens...');
          try {
            const tokenResponse = await AuthSession.exchangeCodeAsync(
              {
                clientId: GOOGLE_MOBILE_CLIENT_ID,
                code,
                redirectUri: GOOGLE_MOBILE_REDIRECT_URI,
                extraParams: {
                  code_verifier: request?.codeVerifier || '',
                },
              },
              {
                tokenEndpoint: 'https://oauth2.googleapis.com/token',
              }
            );
            idToken = tokenResponse.idToken;
            accessToken = tokenResponse.accessToken;
            console.log('[GoogleAuth] Token exchange succeeded! idToken:', !!idToken, 'accessToken:', !!accessToken);
          } catch (exchangeErr: any) {
            console.warn('[GoogleAuth] AuthSession.exchangeCodeAsync failed, attempting direct POST:', exchangeErr);
            const tokenParams = new URLSearchParams({
              client_id: GOOGLE_MOBILE_CLIENT_ID,
              code,
              grant_type: 'authorization_code',
              redirect_uri: GOOGLE_MOBILE_REDIRECT_URI,
              code_verifier: request?.codeVerifier || '',
            });
            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: tokenParams.toString(),
            });
            const tokenData = await tokenRes.json();
            if (tokenData.id_token || tokenData.access_token) {
              idToken = tokenData.id_token;
              accessToken = tokenData.access_token;
              console.log('[GoogleAuth] Direct token exchange succeeded!');
            } else {
              console.error('[GoogleAuth] Direct token exchange error:', tokenData);
              throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange authorization code');
            }
          }
        }

        await completeUserSignIn(idToken, accessToken);
      } else if (authResult?.type === 'cancel' || authResult?.type === 'dismiss') {
        console.log('[GoogleAuth] User cancelled or dismissed Google Sign-In.');
        setLoading(false);
      } else if (authResult?.type === 'error') {
        const msg = authResult.error?.message || 'Google Sign-In encountered an error.';
        console.warn('[GoogleAuth] AuthResult error:', msg);
        setErrorMessage(msg);
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[GoogleAuth] Exception during handleGoogleSignIn:', err);
      setErrorMessage(err.message || 'Could not complete Google Sign-In. Please try again.');
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsGuest(true);
    setHasCompletedOnboarding(true);
    navigation.replace('MainTabs');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header: Digestly wordmark (no square D icon) & Subtitle | Right italic slogan */}
        <View style={styles.topHeader}>
          <View style={styles.brandGroup}>
            <DigestlyWordmark size="lg" color="#FFFFFF" />
            <Text style={styles.regionBadge}>PAKISTAN • REGION • THE WORLD</Text>
          </View>

          <Text style={styles.topRightSlogan}>
            More Context.\nBrighter Perspectives.
          </Text>
        </View>

        {/* Large Headline */}
        <View style={styles.headlineSection}>
          <Text style={styles.mainTitle}>
            News beyond <Text style={styles.titleAccent}>headlines.</Text>
          </Text>
          <Text style={styles.titleSubtext}>
            Curated. Unbiased. Built for a smarter you.
          </Text>
        </View>

        {/* Fanned Card Stack (Pakistan / World / Business / Sports) */}
        <View style={styles.fannedStackContainer}>
          {/* Background Card 3: Sports */}
          <View style={[styles.fannedCard, styles.fannedCard3]}>
            <View style={[styles.cardTag, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
              <Text style={[styles.cardTagText, { color: '#FBBF24' }]}>SPORTS</Text>
            </View>
          </View>

          {/* Background Card 2: Business */}
          <View style={[styles.fannedCard, styles.fannedCard2]}>
            <View style={[styles.cardTag, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Text style={[styles.cardTagText, { color: '#34D399' }]}>BUSINESS</Text>
            </View>
          </View>

          {/* Foreground Top Card: Pakistan */}
          <View style={[styles.fannedCard, styles.fannedCard1]}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
              }}
              style={styles.cardImage}
              contentFit="cover"
            />
            <View style={styles.cardOverlay} />

            <View style={[styles.cardTag, { backgroundColor: 'rgba(56, 189, 248, 0.25)' }]}>
              <Text style={[styles.cardTagText, { color: '#38BDF8' }]}>PAKISTAN</Text>
            </View>

            <View style={styles.topCardHeadlineWrap}>
              <Text style={styles.topCardHeadline} numberOfLines={2}>
                State Bank keeps benchmark policy rate steady amid disinflation
              </Text>
              <Text style={styles.topCardSource}>Dawn • 3-line brief</Text>
            </View>
          </View>
        </View>

        {/* 3 Feature Blocks */}
        <View style={styles.featuresRow}>
          <View style={styles.featureBlock}>
            <View style={[styles.featureIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Ionicons name="flash" size={16} color="#38BDF8" />
            </View>
            <Text style={styles.featureTitle}>3-Line Fact Briefs</Text>
            <Text style={styles.featureDesc}>Synthesised takeaways in seconds.</Text>
          </View>

          <View style={styles.featureBlock}>
            <View style={[styles.featureIconCircle, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
              <Ionicons name="git-network" size={16} color="#34D399" />
            </View>
            <Text style={styles.featureTitle}>Multi-Source Radar</Text>
            <Text style={styles.featureDesc}>Cross-referenced coverage angles.</Text>
          </View>

          <View style={styles.featureBlock}>
            <View style={[styles.featureIconCircle, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
              <Ionicons name="language" size={16} color="#FBBF24" />
            </View>
            <Text style={styles.featureTitle}>Bilingual Intel</Text>
            <Text style={styles.featureDesc}>English & Urdu translations.</Text>
          </View>
        </View>

        {/* Quote Block */}
        <View style={styles.quoteBlock}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#64748B" style={{ marginBottom: 6 }} />
          <Text style={styles.quoteText}>
            "News as it happens, distilled to what matters."
          </Text>
          <Text style={styles.quoteAuthor}>— Digestly Editorial</Text>
        </View>

        {/* Night Earth Graphic with Islamabad, Lahore, Karachi glow pins */}
        <View style={styles.mapGraphicCard}>
          <View style={styles.mapHeaderRow}>
            <Ionicons name="earth" size={14} color="#38BDF8" style={{ marginRight: 6 }} />
            <Text style={styles.mapTitle}>Live National Radar</Text>
          </View>

          <View style={styles.pinLocationsRow}>
            <View style={styles.pinItem}>
              <View style={[styles.pinDot, { backgroundColor: '#38BDF8' }]} />
              <Text style={styles.pinLabel}>Islamabad</Text>
            </View>
            <View style={styles.pinItem}>
              <View style={[styles.pinDot, { backgroundColor: '#34D399' }]} />
              <Text style={styles.pinLabel}>Lahore</Text>
            </View>
            <View style={styles.pinItem}>
              <View style={[styles.pinDot, { backgroundColor: '#FBBF24' }]} />
              <Text style={styles.pinLabel}>Karachi</Text>
            </View>
          </View>
        </View>

        {/* Error notice if sign in fails */}
        {errorMessage && (
          <View style={styles.errorNotice}>
            <Ionicons name="information-circle" size={16} color="#38BDF8" style={{ marginRight: 8 }} />
            <Text style={styles.errorNoticeText}>{errorMessage}</Text>
          </View>
        )}

        {/* Action Buttons: Continue with Google & Continue as Guest */}
        <View style={styles.actionsGroup}>
          {/* White Pill Button: Continue with Google */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleGoogleSignIn}
            disabled={loading}
            style={styles.googlePillButton}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#07090E" />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color="#07090E" style={{ marginRight: 8 }} />
                <Text style={styles.googlePillText}>Continue with Google</Text>
                <Ionicons name="arrow-forward" size={16} color="#07090E" style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>

          {/* Outlined Pill Button: Continue as Guest */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleContinueAsGuest}
            style={styles.guestPillButton}
          >
            <Ionicons name="person-outline" size={16} color="#E2E8F0" style={{ marginRight: 8 }} />
            <Text style={styles.guestPillText}>Continue as Guest</Text>
            <Ionicons name="arrow-forward" size={15} color="#94A3B8" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <Text style={styles.guestHintText}>
            Guest mode saves bookmarks locally on this device.
          </Text>
        </View>

        {/* Footer Credit with divider lines */}
        <View style={styles.footerRow}>
          <View style={styles.footerLine} />
          <Text style={styles.footerCredit}>Made by Studio Xenos</Text>
          <View style={styles.footerLine} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  brandGroup: {
    flex: 1,
  },
  regionBadge: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.2,
    marginTop: 3,
  },
  topRightSlogan: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#94A3B8',
    textAlign: 'right',
    lineHeight: 15,
  },
  headlineSection: {
    marginBottom: 22,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  titleAccent: {
    color: '#38BDF8',
  },
  titleSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 6,
    letterSpacing: -0.1,
  },
  fannedStackContainer: {
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  fannedCard: {
    position: 'absolute',
    width: '92%',
    height: 155,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  fannedCard3: {
    backgroundColor: '#111622',
    borderColor: '#1E2638',
    transform: [{ rotate: '5deg' }, { translateY: -4 }],
    opacity: 0.6,
  },
  fannedCard2: {
    backgroundColor: '#141B2A',
    borderColor: '#243048',
    transform: [{ rotate: '-3deg' }, { translateY: -2 }],
    opacity: 0.85,
  },
  fannedCard1: {
    backgroundColor: '#182030',
    borderColor: '#2A3854',
    overflow: 'hidden',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 9, 14, 0.65)',
  },
  cardTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  topCardHeadlineWrap: {
    marginTop: 'auto',
  },
  topCardHeadline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  topCardSource: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  featureBlock: {
    flex: 1,
    backgroundColor: '#111622',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E2638',
    padding: 12,
    alignItems: 'center',
    textAlign: 'center',
  },
  featureIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 13,
  },
  quoteBlock: {
    backgroundColor: '#0D111A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E2638',
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  quoteText: {
    fontSize: 13.5,
    fontStyle: 'italic',
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 18,
  },
  quoteAuthor: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 6,
  },
  mapGraphicCard: {
    backgroundColor: '#111622',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E2638',
    padding: 12,
    marginBottom: 20,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mapTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  pinLocationsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  pinItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  pinLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  errorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#182030',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2A364F',
  },
  errorNoticeText: {
    fontSize: 12,
    color: '#E2E8F0',
    flex: 1,
    lineHeight: 16,
  },
  actionsGroup: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
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
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  googlePillText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#07090E',
    letterSpacing: 0.1,
  },
  guestPillButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#2A364F',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    letterSpacing: 0.1,
  },
  guestHintText: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E2638',
  },
  footerCredit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.4,
  },
});
