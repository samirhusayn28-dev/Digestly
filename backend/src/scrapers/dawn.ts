import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedRawArticle } from '../types/index.js';
import { extractOgImage, getFallbackImageForCategory } from './imageHelper.js';

export async function scrapeDawnNews(): Promise<ScrapedRawArticle[]> {
  const articles: ScrapedRawArticle[] = [];
  // Dawn provides official direct RSS feeds with high-res media:content webp images
  const feedUrls = [
    'https://www.dawn.com/feeds/home/',
    'https://www.dawn.com/feeds/pakistan/',
    'https://www.dawn.com/feeds/business/',
    'https://www.dawn.com/feeds/tech/',
    'https://www.dawn.com/feeds/sport/',
    'https://www.dawn.com/feeds/world/',
    'https://www.dawn.com/feeds/latest-news/',
  ];

  for (const feedUrl of feedUrls) {
    try {
      const response = await axios.get(feedUrl, {
        timeout: 8000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
      });

      const $ = cheerio.load(response.data, { xmlMode: true });

      $('item').each((_, elem) => {
        const rawTitle = $(elem).find('title').text().trim();
        const link = $(elem).find('link').text().trim();
        const pubDate = $(elem).find('pubDate').text().trim();
        const rawDescription = $(elem).find('description').text().trim();

        // Extract real image from Dawn's native media:content or enclosure
        let imageUrl =
          $(elem).find('media\\:content').attr('url') ||
          $(elem).find('enclosure').attr('url') ||
          $(elem).find('content').attr('url') ||
          null;

        // Clean up title
        const title = rawTitle.replace(/\s*-\s*Dawn\s*$/i, '').trim();

        if (title && link) {
          const desc$ = cheerio.load(rawDescription);
          const bodySnippet = desc$.text().trim();

          // Infer category from URL or title
          let category = 'Politics';
          const lower = title.toLowerCase();
          const lowerUrl = feedUrl.toLowerCase();

          if (lowerUrl.includes('business') || lower.includes('economy') || lower.includes('inflation') || lower.includes('sbp') || lower.includes('market') || lower.includes('rupee') || lower.includes('imf') || lower.includes('psx')) {
            category = 'Business & Economy';
          } else if (lowerUrl.includes('tech') || lower.includes('tech') || lower.includes('digital') || lower.includes('ai') || lower.includes('software') || lower.includes('telecom')) {
            category = 'Technology & AI';
          } else if (lowerUrl.includes('sport') || lower.includes('cricket') || lower.includes('pcb') || lower.includes('trophy') || lower.includes('match') || lower.includes('psl')) {
            category = 'Sports';
          } else if (lowerUrl.includes('world') || lower.includes('un') || lower.includes('us') || lower.includes('china') || lower.includes('india') || lower.includes('gaza') || lower.includes('brics')) {
            category = 'World';
          } else if (lower.includes('climate') || lower.includes('smog') || lower.includes('flood') || lower.includes('environment') || lower.includes('pollution')) {
            category = 'Environment & Climate';
          } else if (lower.includes('health') || lower.includes('dengue') || lower.includes('polio') || lower.includes('hospital') || lower.includes('doctor')) {
            category = 'Health';
          } else if (lower.includes('film') || lower.includes('culture') || lower.includes('actor') || lower.includes('art') || lower.includes('music') || lower.includes('cinema')) {
            category = 'Entertainment';
          } else if (lower.includes('school') || lower.includes('university') || lower.includes('student') || lower.includes('education') || lower.includes('exam')) {
            category = 'Education';
          } else if (lower.includes('science') || lower.includes('space') || lower.includes('research') || lower.includes('nasa')) {
            category = 'Science';
          }

          articles.push({
            title,
            body: bodySnippet || title,
            sourceName: 'Dawn',
            sourceUrl: link,
            category,
            imageUrl: imageUrl || getFallbackImageForCategory(category),
            publishedAt: pubDate || 'Recently',
          });
        }
      });
    } catch (err) {
      console.warn('Error fetching Dawn feed:', feedUrl, err);
    }
  }

  // Deduplicate by title
  const seen = new Set<string>();
  const uniqueArticles = articles.filter((a) => {
    const key = a.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);

  // If any articles have fallback images, attempt to resolve real og:image from the article page
  await Promise.allSettled(
    uniqueArticles.map(async (art) => {
      if (!art.imageUrl || art.imageUrl.includes('unsplash.com')) {
        const og = await extractOgImage(art.sourceUrl, 3000);
        if (og) art.imageUrl = og;
      }
    })
  );

  return uniqueArticles;
}
