import axios from 'axios';
import * as cheerio from 'cheerio';

// Curated, distinct editorial fallback images per category
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  Politics: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
  Business: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
  Tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  Technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  Sports: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
  Entertainment: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  World: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80',
  General: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=800&q=80',
};

export function getFallbackImageForCategory(category?: string): string {
  if (category && CATEGORY_FALLBACK_IMAGES[category]) {
    return CATEGORY_FALLBACK_IMAGES[category];
  }
  return CATEGORY_FALLBACK_IMAGES['General'];
}

/**
 * Fast HTML metadata fetcher to extract og:image or twitter:image from article URL
 */
export async function extractOgImage(url: string, timeoutMs: number = 3500): Promise<string | null> {
  if (!url || !url.startsWith('http')) return null;

  try {
    const response = await axios.get(url, {
      timeout: timeoutMs,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      maxRedirects: 3,
    });

    const $ = cheerio.load(response.data);
    const ogImage =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[property="twitter:image"]').attr('content') ||
      $('link[rel="image_src"]').attr('href');

    if (ogImage && ogImage.startsWith('http')) {
      return ogImage.trim();
    }
  } catch {
    // Ignore timeout or network errors; fallback image will be used
  }

  return null;
}
