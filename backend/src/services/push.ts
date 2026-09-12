import axios from 'axios';
import { ProcessedArticle } from '../types/index.js';
import { getUsersWithPushTokens } from './firebase-admin.js';

interface ExpoPushMessage {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'high';
  channelId?: 'breaking';
}

export async function sendBreakingNewsPushNotifications(
  breakingArticles: ProcessedArticle[]
): Promise<{ sent: number; failed: number }> {
  if (!breakingArticles || breakingArticles.length === 0) {
    return { sent: 0, failed: 0 };
  }

  try {
    const users = await getUsersWithPushTokens();
    if (users.length === 0) {
      console.log('[Push] No registered devices with push tokens found in Firestore.');
      return { sent: 0, failed: 0 };
    }

    const messages: ExpoPushMessage[] = [];

    for (const article of breakingArticles) {
      const artCategory = (article.category || 'General').toLowerCase();

      for (const user of users) {
        // If user has notification preferences, check if category is enabled
        if (user.categoryPreferences && user.categoryPreferences.length > 0) {
          const lowerPrefs = user.categoryPreferences.map((c) => c.toLowerCase());
          if (!lowerPrefs.includes(artCategory) && !lowerPrefs.includes('top stories')) {
            continue;
          }
        }

        messages.push({
          to: user.pushToken,
          sound: 'default',
          title: `🚨 BREAKING: ${article.sourceName}`,
          body: article.title,
          data: {
            articleId: article.id,
            category: article.category,
            url: article.sourceUrl,
          },
          priority: 'high',
          channelId: 'breaking',
        });
      }
    }

    if (messages.length === 0) {
      return { sent: 0, failed: 0 };
    }

    // Expo recommends chunks of up to 100 messages
    const chunks: ExpoPushMessage[][] = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    let sent = 0;
    let failed = 0;

    for (const chunk of chunks) {
      try {
        const res = await axios.post('https://exp.host/--/api/v2/push/send', chunk, {
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });

        if (res.status === 200) {
          sent += chunk.length;
        } else {
          failed += chunk.length;
        }
      } catch (err) {
        console.warn('Error sending Expo push batch:', err);
        failed += chunk.length;
      }
    }

    console.log(`[Push] Dispatched ${sent} breaking news notifications (${failed} failed).`);
    return { sent, failed };
  } catch (error) {
    console.warn('Failed in sendBreakingNewsPushNotifications:', error);
    return { sent: 0, failed: 0 };
  }
}
