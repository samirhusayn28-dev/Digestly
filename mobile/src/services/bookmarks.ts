import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './firebase';
import { Article } from '../navigation/types';
import { REALISTIC_SEED_ARTICLES } from './articles';

// Sync bookmark toggle to user's Firestore profile
export async function syncBookmarkToFirestore(
  userId: string,
  articleId: string,
  shouldAdd: boolean
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      bookmarks: shouldAdd ? arrayUnion(articleId) : arrayRemove(articleId),
    });
  } catch (error) {
    console.warn('Failed to sync bookmark to Firestore (offline fallback active):', error);
  }
}

// Fetch full article objects for bookmarked IDs
export async function fetchBookmarkedArticles(articleIds: string[]): Promise<Article[]> {
  if (!articleIds || articleIds.length === 0) {
    return [];
  }

  const articles: Article[] = [];

  for (const id of articleIds) {
    try {
      const docRef = doc(db, 'articles', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        articles.push({
          id: docSnap.id,
          title: data.title,
          summary: Array.isArray(data.summary) ? data.summary : [data.summary],
          sourceName: data.sourceName || 'Dawn',
          sourceUrl: data.sourceUrl || 'https://www.dawn.com',
          category: data.category || 'General',
          imageUrl: data.imageUrl,
          publishedAt: data.publishedAt || 'Saved',
          scrapedAt: data.scrapedAt || new Date().toISOString(),
          isBreaking: !!data.isBreaking,
          relatedSources: data.relatedSources || [],
        });
        continue;
      }
    } catch (e) {
      // Continue to seed fallback
    }

    // Fallback to local realistic seed article if Firestore read missed
    const seedMatch = REALISTIC_SEED_ARTICLES.find((a) => a.id === id);
    if (seedMatch) {
      articles.push(seedMatch);
    }
  }

  return articles;
}
