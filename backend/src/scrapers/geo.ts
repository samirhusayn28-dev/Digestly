import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedRawArticle } from '../types/index.js';

export async function scrapeGeoNews(): Promise<ScrapedRawArticle[]> {
  const articles: ScrapedRawArticle[] = [];
  const feedUrls = [
    'https://www.geo.tv/rss/1/1', // Pakistan English
    'https://www.geo.tv/rss/1/3', // Sports English
  ];

  for (const url of feedUrls) {
    try {
      const response = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
      });

      const $ = cheerio.load(response.data, { xmlMode: true });

      $('item').each((_, elem) => {
        const title = $(elem).find('title').text().trim();
        const link = $(elem).find('link').text().trim();
        const pubDate = $(elem).find('pubDate').text().trim();
        const rawDescription = $(elem).find('description').text().trim();

        // Extract image
        let imageUrl: string | null = null;
        const enclosure = $(elem).find('enclosure').attr('url');
        const media = $(elem).find('media\\:content, media\\:thumbnail').attr('url');
        if (enclosure) {
          imageUrl = enclosure;
        } else if (media) {
          imageUrl = media;
        }

        const desc$ = cheerio.load(rawDescription);
        const bodySnippet = desc$.text().trim();

        if (title && link) {
          let category = url.includes('1/3') ? 'Sports' : 'Politics';
          const lower = title.toLowerCase();

          if (lower.includes('cricket') || lower.includes('pcb') || lower.includes('psl') || lower.includes('babar')) {
            category = 'Sports';
          } else if (lower.includes('economy') || lower.includes('rupee') || lower.includes('inflation') || lower.includes('gold') || lower.includes('stock')) {
            category = 'Business';
          } else if (lower.includes('tech') || lower.includes('ai') || lower.includes('telecom')) {
            category = 'Tech';
          } else if (lower.includes('drama') || lower.includes('film') || lower.includes('music') || lower.includes('actor')) {
            category = 'Entertainment';
          } else if (lower.includes('world') || lower.includes('gaza') || lower.includes('un') || lower.includes('china')) {
            category = 'World';
          }

          articles.push({
            title,
            body: bodySnippet || title,
            sourceName: 'Geo News',
            sourceUrl: link,
            category,
            imageUrl: imageUrl || 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=600&q=80',
            publishedAt: pubDate || 'Recently',
          });
        }
      });
    } catch (err) {
      console.warn('Error fetching Geo News feed:', err);
    }
  }

  // Deduplicate by title
  const seen = new Set<string>();
  return articles.filter((a) => {
    const key = a.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);
}
