import AsyncStorage from '@react-native-async-storage/async-storage';
import { Article } from '../navigation/types';

const TRANSLATION_CACHE_KEY = 'digestly_translation_cache_v1';
const memoryCache = new Map<string, string>();

let isCacheHydrated = false;

async function hydrateCache() {
  if (isCacheHydrated) return;
  try {
    const raw = await AsyncStorage.getItem(TRANSLATION_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.entries(parsed).forEach(([k, v]) => {
        memoryCache.set(k, v as string);
      });
    }
  } catch (e) {
    console.warn('Translation cache hydration warning:', e);
  } finally {
    isCacheHydrated = true;
  }
}

async function persistCache() {
  try {
    const obj: Record<string, string> = {};
    memoryCache.forEach((v, k) => {
      obj[k] = v;
    });
    // Limit cache size to 400 entries to keep AsyncStorage lean
    const entries = Object.entries(obj);
    const trimmed = entries.slice(Math.max(0, entries.length - 400));
    await AsyncStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(Object.fromEntries(trimmed)));
  } catch (e) {
    console.warn('Failed to persist translation cache:', e);
  }
}

/**
 * Translates a single text string from English to Urdu using the Google Translate GTX endpoint.
 */
export async function translateText(text: string, targetLang: 'ur' | 'en' = 'ur'): Promise<string> {
  if (!text || targetLang === 'en') return text;

  await hydrateCache();

  const cacheKey = `${targetLang}:${text.trim()}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(
      text
    )}`;

    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      return text;
    }

    const data = await response.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0].map((item: any) => item[0]).join('');
      if (translated) {
        memoryCache.set(cacheKey, translated);
        persistCache();
        return translated;
      }
    }
    return text;
  } catch (error) {
    // Graceful offline fallback: return original English
    return text;
  }
}

export interface TranslatedArticleData {
  title: string;
  summary: string[];
  body?: string;
  isUrdu: boolean;
}

/**
 * Translates an article's headline and 3-line summaries into Urdu.
 */
export async function translateArticleContent(
  article: Article,
  targetLang: 'ur' | 'en' = 'ur'
): Promise<TranslatedArticleData> {
  if (targetLang === 'en') {
    return {
      title: article.title,
      summary: article.summary,
      body: article.body,
      isUrdu: false,
    };
  }

  try {
    const [translatedTitle, ...translatedBullets] = await Promise.all([
      translateText(article.title, 'ur'),
      ...article.summary.map((bullet) => translateText(bullet, 'ur')),
    ]);

    let translatedBody = article.body;
    if (article.body && article.body.length < 1500) {
      translatedBody = await translateText(article.body, 'ur');
    }

    return {
      title: translatedTitle || article.title,
      summary: translatedBullets.length > 0 ? translatedBullets : article.summary,
      body: translatedBody || article.body,
      isUrdu: true,
    };
  } catch {
    return {
      title: article.title,
      summary: article.summary,
      body: article.body,
      isUrdu: false,
    };
  }
}
