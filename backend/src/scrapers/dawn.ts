import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedRawArticle } from '../types/index.js';

export async function scrapeDawnNews(): Promise<ScrapedRawArticle[]> {
  const articles: ScrapedRawArticle[] = [];
  const feedUrls = [
    'https://news.google.com/rss/search?q=site:dawn.com&hl=en-PK&gl=PK&ceid=PK:en',
    'https://news.google.com/rss/search?q=site:dawn.com+pakistan&hl=en-PK&gl=PK&ceid=PK:en',
  ];

  for (const feedUrl of feedUrls) {
    try {
      const response = await axios.get(feedUrl, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const $ = cheerio.load(response.data, { xmlMode: true });

      $('item').each((_, elem) => {
        const rawTitle = $(elem).find('title').text().trim();
        const link = $(elem).find('link').text().trim();
        const pubDate = $(elem).find('pubDate').text().trim();
        const rawDescription = $(elem).find('description').text().trim();

        // Clean up title (remove "- Dawn" suffix from Google News)
        const title = rawTitle.replace(/\s*-\s*Dawn\s*$/i, '').trim();

        if (title && link) {
          // Extract plain text snippet from description HTML
          const desc$ = cheerio.load(rawDescription);
          const bodySnippet = desc$.text().trim();

          // Infer category from title
          let category = 'Politics';
          const lower = title.toLowerCase();
          if (lower.includes('economy') || lower.includes('inflation') || lower.includes('sbp') || lower.includes('market') || lower.includes('rupee')) {
            category = 'Business';
          } else if (lower.includes('tech') || lower.includes('digital') || lower.includes('ai') || lower.includes('software')) {
            category = 'Tech';
          } else if (lower.includes('cricket') || lower.includes('pcb') || lower.includes('trophy') || lower.includes('match')) {
            category = 'Sports';
          } else if (lower.includes('film') || lower.includes('culture') || lower.includes('actor') || lower.includes('art')) {
            category = 'Entertainment';
          } else if (lower.includes('un') || lower.includes('us') || lower.includes('china') || lower.includes('india') || lower.includes('gaza')) {
            category = 'World';
          }

          articles.push({
            title,
            body: bodySnippet || title,
            sourceName: 'Dawn',
            sourceUrl: link,
            category,
            imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80',
            publishedAt: pubDate || 'Recently',
          });
        }
      });
    } catch (err) {
      console.warn('Error fetching Dawn feed:', err);
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
