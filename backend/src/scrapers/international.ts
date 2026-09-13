import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedRawArticle } from '../types/index.js';
import { getFallbackImageForCategory } from './imageHelper.js';

export async function scrapeInternationalNews(): Promise<ScrapedRawArticle[]> {
  const articles: ScrapedRawArticle[] = [];

  const feeds = [
    {
      sourceName: 'BBC World',
      url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    },
    {
      sourceName: 'Al Jazeera',
      url: 'https://news.google.com/rss/search?q=source:%22Al+Jazeera%22+when:1d&hl=en-US&gl=US&ceid=US:en',
    },
    {
      sourceName: 'Reuters',
      url: 'https://news.google.com/rss/search?q=source:Reuters+when:1d&hl=en-US&gl=US&ceid=US:en',
    },
    {
      sourceName: 'Associated Press',
      url: 'https://news.google.com/rss/search?q=source:%22Associated+Press%22+when:1d&hl=en-US&gl=US&ceid=US:en',
    },
    {
      sourceName: 'CNN',
      url: 'http://rss.cnn.com/rss/edition_world.rss',
    },
  ];

  for (const feed of feeds) {
    try {
      const response = await axios.get(feed.url, {
        timeout: 8000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
      });

      const $ = cheerio.load(response.data, { xmlMode: true });

      $('item').slice(0, 8).each((_, elem) => {
        const rawTitle = $(elem).find('title').text().trim();
        const link = $(elem).find('link').text().trim();
        const pubDate = $(elem).find('pubDate').text().trim();
        const rawDescription = $(elem).find('description').text().trim();

        // Extract thumbnail/image
        let imageUrl: string | null = null;
        const mediaThumbnail = $(elem).find('media\\:thumbnail').attr('url');
        const mediaContent = $(elem).find('media\\:content').attr('url');
        const enclosure = $(elem).find('enclosure').attr('url');

        if (mediaThumbnail) {
          imageUrl = mediaThumbnail;
        } else if (mediaContent) {
          imageUrl = mediaContent;
        } else if (enclosure) {
          imageUrl = enclosure;
        }

        const title = rawTitle.replace(/\s*-\s*BBC News\s*$/i, '').replace(/\s*\|\s*Al Jazeera\s*$/i, '').trim();

        if (title && link) {
          const desc$ = cheerio.load(rawDescription);
          const bodySnippet = desc$.text().trim();

          const lower = title.toLowerCase();
          let category = 'World';

          if (lower.includes('tech') || lower.includes('ai') || lower.includes('cyber') || lower.includes('google') || lower.includes('apple') || lower.includes('chip')) {
            category = 'Technology & AI';
          } else if (lower.includes('climate') || lower.includes('warming') || lower.includes('carbon') || lower.includes('flood') || lower.includes('wildfire')) {
            category = 'Environment & Climate';
          } else if (lower.includes('health') || lower.includes('virus') || lower.includes('hospital') || lower.includes('vaccine') || lower.includes('disease')) {
            category = 'Health';
          } else if (lower.includes('economy') || lower.includes('inflation') || lower.includes('market') || lower.includes('oil') || lower.includes('trade')) {
            category = 'Business & Economy';
          } else if (lower.includes('cricket') || lower.includes('football') || lower.includes('olympics') || lower.includes('championship')) {
            category = 'Sports';
          } else if (lower.includes('film') || lower.includes('oscar') || lower.includes('music') || lower.includes('actor') || lower.includes('cinema')) {
            category = 'Entertainment';
          } else if (lower.includes('science') || lower.includes('space') || lower.includes('nasa') || lower.includes('mars') || lower.includes('telescope')) {
            category = 'Science';
          }

          articles.push({
            title,
            body: bodySnippet.length > 30 ? bodySnippet : `${title}. Comprehensive international coverage reported by ${feed.sourceName}.`,
            sourceName: feed.sourceName,
            sourceUrl: link,
            category,
            imageUrl: imageUrl || getFallbackImageForCategory(category),
            publishedAt: pubDate || new Date().toISOString(),
          });
        }
      });
    } catch (err) {
      console.warn(`International scraper error for ${feed.sourceName}:`, err);
    }
  }

  return articles;
}
