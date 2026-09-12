import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedRawArticle } from '../types/index.js';
import { extractOgImage, getFallbackImageForCategory } from './imageHelper.js';

export async function scrapeTribuneNews(): Promise<ScrapedRawArticle[]> {
  const articles: ScrapedRawArticle[] = [];
  const feedUrls = [
    'https://tribune.com.pk/feed/latest',
    'https://tribune.com.pk/feed/pakistan',
  ];

  for (const url of feedUrls) {
    try {
      const response = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
      });

      const $ = cheerio.load(response.data, { xmlMode: true });

      $('item').each((_, elem) => {
        const title = $(elem).find('title').text().trim();
        const link = $(elem).find('link').text().trim();
        const pubDate = $(elem).find('pubDate').text().trim();
        const rawDescription = $(elem).find('description').text().trim();
        const rawCategory = $(elem).find('category').text().trim();

        // Extract thumbnail image if present in enclosure or media:content
        let imageUrl: string | null = null;
        const enclosure = $(elem).find('enclosure').attr('url');
        const mediaContent = $(elem).find('media\\:content, content').attr('url');

        if (enclosure) {
          imageUrl = enclosure;
        } else if (mediaContent) {
          imageUrl = mediaContent;
        }

        // Clean HTML tags from description
        const desc$ = cheerio.load(rawDescription);
        const bodySnippet = desc$.text().trim();

        if (title && link) {
          let category = 'Politics';
          const lowerCat = rawCategory.toLowerCase();
          const lowerTitle = title.toLowerCase();

          if (
            lowerCat.includes('business') ||
            lowerCat.includes('economy') ||
            lowerTitle.includes('sbp') ||
            lowerTitle.includes('psx') ||
            lowerTitle.includes('rupee') ||
            lowerTitle.includes('market')
          ) {
            category = 'Business';
          } else if (
            lowerCat.includes('tech') ||
            lowerTitle.includes('tech') ||
            lowerTitle.includes('ai') ||
            lowerTitle.includes('digital')
          ) {
            category = 'Tech';
          } else if (
            lowerCat.includes('sports') ||
            lowerTitle.includes('cricket') ||
            lowerTitle.includes('match') ||
            lowerTitle.includes('pcb')
          ) {
            category = 'Sports';
          } else if (lowerCat.includes('life') || lowerCat.includes('entertainment')) {
            category = 'Entertainment';
          } else if (lowerCat.includes('world') || lowerCat.includes('international')) {
            category = 'World';
          }

          articles.push({
            title,
            body: bodySnippet || title,
            sourceName: 'The Express Tribune',
            sourceUrl: link,
            category,
            imageUrl: imageUrl || getFallbackImageForCategory(category),
            publishedAt: pubDate || 'Recently',
          });
        }
      });
    } catch (err) {
      console.warn('Error fetching Tribune feed:', err);
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

  // Concurrently fetch real og:image from the article page for Tribune stories
  await Promise.allSettled(
    uniqueArticles.map(async (art) => {
      if (!art.imageUrl || art.imageUrl.includes('unsplash.com')) {
        const og = await extractOgImage(art.sourceUrl, 3500);
        if (og) art.imageUrl = og;
      }
    })
  );

  return uniqueArticles;
}
