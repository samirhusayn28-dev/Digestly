import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore - getReactNativePersistence is available in the react-native condition
import { initializeAuth, getReactNativePersistence, getAuth, GoogleAuthProvider, signInWithCredential, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { UserProfile } from '../store/useAppStore';

export const firebaseConfig = {
  apiKey: Platform.select({
    ios: 'AIzaSyD-W44BA-ilqMoQLX5vNd-r4VJtsjPnMWo',
    default: 'AIzaSyBHiD_YHTJielK4F6Btq5NZ6Oi87EwOaQo',
  }),
  authDomain: 'digestly-cbe3c.firebaseapp.com',
  projectId: 'digestly-cbe3c',
  storageBucket: 'digestly-cbe3c.firebasestorage.app',
  messagingSenderId: '331798617464',
  appId: Platform.select({
    ios: '1:331798617464:ios:df99722ad11145686ebc8d',
    default: '1:331798617464:android:192b524b149bc47d6ebc8d',
  }),
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage Persistence
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);

// Client IDs for Google Sign In
export const GOOGLE_CONFIG = {
  // Web Client ID (Registered in Google Cloud as Web Application)
  webClientId: '331798617464-6pi4bt4ugdkt2q2vvcd39t493qive0gd.apps.googleusercontent.com',
  // iOS Client ID
  iosClientId: '331798617464-q6l7vvrdml02as6buf5nsp2sh7i1le4d.apps.googleusercontent.com',
  // Android OAuth Client ID - Set via env or dynamically once registered in Google Cloud Console
  // Package: com.digestly.app | SHA-1: C5:8E:09:70:AA:A4:71:92:7E:69:89:DD:3F:0F:32:EC:49:62:A0:E2
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined,
};

// Sign in with Google Credential from expo-auth-session
export async function signInWithGoogleTokens(idToken?: string, accessToken?: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken ?? null, accessToken ?? null);
  const userCredential = await signInWithCredential(auth, credential);
  return userCredential.user;
}

// Sync user profile to Firestore
export async function syncUserProfileToFirestore(
  user: { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null },
  interests: string[] = ['Politics', 'Tech', 'Business'],
  notificationPrefs: Record<string, boolean> = { breaking: true, politics: true, tech: true }
): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const existingDoc = await getDoc(userRef);

  let mergedInterests = interests;
  let mergedPrefs = notificationPrefs;

  if (existingDoc.exists()) {
    const data = existingDoc.data();
    if (data.interests && data.interests.length > 0) {
      mergedInterests = data.interests;
    }
    if (data.notificationPrefs) {
      mergedPrefs = { ...notificationPrefs, ...data.notificationPrefs };
    }
  }

  const profileData: UserProfile = {
    uid: user.uid,
    displayName: user.displayName || 'Reader',
    email: user.email || null,
    photoURL: user.photoURL || null,
    interests: mergedInterests,
    notificationPrefs: mergedPrefs,
  };

  await setDoc(
    userRef,
    {
      ...profileData,
      lastLoginAt: serverTimestamp(),
    },
    { merge: true }
  );

  return profileData;
}

// Sign out
export async function signOutCurrentUser(): Promise<void> {
  await signOut(auth);
}
