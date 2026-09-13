import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedRawArticle } from '../types/index.js';
import { extractOgImage, getFallbackImageForCategory } from './imageHelper.js';

export async function scrapeGeoNews(): Promise<ScrapedRawArticle[]> {
  const articles: ScrapedRawArticle[] = [];
  const feedUrls = [
    'https://www.geo.tv/rss/1/1', // Pakistan English
    'https://www.geo.tv/rss/1/2', // World
    'https://www.geo.tv/rss/1/3', // Sports English
    'https://www.geo.tv/rss/1/4', // Business
    'https://www.geo.tv/rss/1/5', // Entertainment
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

        // Extract image from RSS media/enclosure or <img> inside description HTML
        let imageUrl: string | null = null;
        const enclosure = $(elem).find('enclosure').attr('url');
        const media = $(elem).find('media\\:content, media\\:thumbnail, content').attr('url');

        const desc$ = cheerio.load(rawDescription);
        const descImg = desc$('img').attr('src');

        if (enclosure) {
          imageUrl = enclosure;
        } else if (media) {
          imageUrl = media;
        } else if (descImg && descImg.startsWith('http')) {
          imageUrl = descImg;
        }

        const bodySnippet = desc$.text().trim();

        if (title && link) {
          let category = 'Politics';
          const lower = title.toLowerCase();

          if (url.includes('1/3') || lower.includes('cricket') || lower.includes('pcb') || lower.includes('psl') || lower.includes('babar') || lower.includes('match')) {
            category = 'Sports';
          } else if (url.includes('1/4') || lower.includes('economy') || lower.includes('rupee') || lower.includes('inflation') || lower.includes('gold') || lower.includes('stock') || lower.includes('tax')) {
            category = 'Business & Economy';
          } else if (lower.includes('tech') || lower.includes('ai') || lower.includes('telecom') || lower.includes('digital')) {
            category = 'Technology & AI';
          } else if (url.includes('1/5') || lower.includes('drama') || lower.includes('film') || lower.includes('music') || lower.includes('actor') || lower.includes('cinema')) {
            category = 'Entertainment';
          } else if (url.includes('1/2') || lower.includes('world') || lower.includes('gaza') || lower.includes('un') || lower.includes('china')) {
            category = 'World';
          } else if (lower.includes('health') || lower.includes('polio') || lower.includes('hospital') || lower.includes('medical')) {
            category = 'Health';
          } else if (lower.includes('climate') || lower.includes('smog') || lower.includes('flood') || lower.includes('weather')) {
            category = 'Environment & Climate';
          } else if (lower.includes('school') || lower.includes('university') || lower.includes('student') || lower.includes('education')) {
            category = 'Education';
          } else if (lower.includes('science') || lower.includes('space')) {
            category = 'Science';
          }

          articles.push({
            title,
            body: bodySnippet || title,
            sourceName: 'Geo News',
            sourceUrl: link,
            category,
            imageUrl: imageUrl || getFallbackImageForCategory(category),
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
  const uniqueArticles = articles.filter((a) => {
    const key = a.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);

  // If any images are missing, attempt to extract og:image from the article page
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
