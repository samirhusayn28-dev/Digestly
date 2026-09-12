import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Configure notification behavior when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(userId?: string): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Get project push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'digestly-cbe3c',
    }).catch(() => null);

    if (tokenData?.data) {
      token = tokenData.data;

      // Save to user's Firestore document if authenticated
      if (userId) {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { pushToken: token }, { merge: true });
      }
    }
  } catch (error) {
    console.warn('Error configuring push notifications:', error);
  }

  return token;
}

// Send local test notification respecting preferences
export async function scheduleBreakingNewsNotification(
  title: string,
  summary: string,
  category: string,
  userPrefs?: Record<string, boolean>
) {
  // Check user preference for category
  const catKey = category.toLowerCase();
  if (userPrefs && userPrefs[catKey] === false) {
    console.log(`Notification skipped: user has muted ${category}`);
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚨 BREAKING: ${title}`,
        body: summary,
        data: { category },
        sound: true,
      },
      trigger: null, // deliver immediately
    });
  } catch (err) {
    console.warn('Could not schedule local notification:', err);
  }
}
