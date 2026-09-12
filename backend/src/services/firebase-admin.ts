import admin from 'firebase-admin';
import axios from 'axios';
import { ProcessedArticle } from '../types/index.js';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'digestly-cbe3c';
const API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyBHiD_YHTJielK4F6Btq5NZ6Oi87EwOaQo';

let hasInitializedAdmin = false;

function initFirebaseAdmin() {
  if (hasInitializedAdmin || admin.apps.length > 0) {
    return admin.firestore();
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    try {
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: PROJECT_ID,
          clientEmail,
          privateKey,
        }),
      });
      hasInitializedAdmin = true;
      return admin.firestore();
    } catch (e) {
      console.warn('Firebase Admin cert init failed:', e);
    }
  }

  // Return null so saveArticlesToFirestore uses REST API with project API key
  return null;
}

// Save articles to Firestore (Admin SDK with fallback to REST API)
export async function saveArticlesToFirestore(articles: ProcessedArticle[]): Promise<{ saved: number; errors: number }> {
  let saved = 0;
  let errors = 0;

  const firestore = initFirebaseAdmin();

  for (const article of articles) {
    try {
      if (firestore) {
        // Use Firebase Admin Firestore
        const docRef = firestore.collection('articles').doc(article.id);
        await docRef.set(
          {
            ...article,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        saved++;
      } else {
        // Use Firestore REST API fallback
        await saveViaRestApi(article);
        saved++;
      }
    } catch (err) {
      console.warn(`Error writing article ${article.id} to Firestore:`, err);
      errors++;
    }
  }

  return { saved, errors };
}

// Fallback write using Firestore REST API
async function saveViaRestApi(article: ProcessedArticle) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/articles/${encodeURIComponent(article.id)}?key=${API_KEY}`;

  const fields: Record<string, any> = {
    title: { stringValue: article.title },
    sourceName: { stringValue: article.sourceName },
    sourceUrl: { stringValue: article.sourceUrl },
    category: { stringValue: article.category },
    publishedAt: { stringValue: article.publishedAt },
    scrapedAt: { stringValue: article.scrapedAt },
    isBreaking: { booleanValue: article.isBreaking },
    summary: {
      arrayValue: {
        values: article.summary.map((s) => ({ stringValue: s })),
      },
    },
  };

  if (article.imageUrl) {
    fields.imageUrl = { stringValue: article.imageUrl };
  }

  if (article.relatedSources && article.relatedSources.length > 0) {
    fields.relatedSources = {
      arrayValue: {
        values: article.relatedSources.map((r) => ({
          mapValue: {
            fields: {
              sourceName: { stringValue: r.sourceName },
              sourceUrl: { stringValue: r.sourceUrl },
              headline: { stringValue: r.headline },
              angleHighlight: { stringValue: r.angleHighlight || '' },
            },
          },
        })),
      },
    };
  }

  await axios.patch(url, { fields });
}
