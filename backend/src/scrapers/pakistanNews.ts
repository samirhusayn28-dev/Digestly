import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedRawArticle } from '../types/index.js';
import { getFallbackImageForCategory } from './imageHelper.js';

interface NewsFeedConfig {
  sourceName: string;
  url: string;
  defaultCategory?: string;
}

export async function scrapeExpandedPakistanNews(): Promise<ScrapedRawArticle[]> {
  const articles: ScrapedRawArticle[] = [];

  const feeds: NewsFeedConfig[] = [
    {
      sourceName: 'The News International',
      url: 'https://www.thenews.com.pk/rss/1/1',
      defaultCategory: 'Politics',
    },
    {
      sourceName: 'Business Recorder',
      url: 'https://www.brecorder.com/feeds/latest-news/',
      defaultCategory: 'Business & Economy',
    },
    {
      sourceName: 'ARY News',
      url: 'https://arynews.tv/feed/',
      defaultCategory: 'Politics',
    },
    {
      sourceName: 'Samaa TV',
      url: 'https://www.samaa.tv/feed/',
      defaultCategory: 'Politics',
    },
    {
      sourceName: 'Dunya News',
      url: 'https://dunyanews.tv/index.php/en/rss/',
      defaultCategory: 'Politics',
    },
    {
      sourceName: '92 News',
      url: 'https://92newshd.tv/feed/',
      defaultCategory: 'Politics',
    },
    {
      sourceName: 'Pakistan Today',
      url: 'https://www.pakistantoday.com.pk/feed/',
      defaultCategory: 'Politics',
    },
    {
      sourceName: 'Daily Times',
      url: 'https://dailytimes.com.pk/feed/',
      defaultCategory: 'Politics',
    },
    {
      sourceName: 'The Nation',
      url: 'https://www.nation.com.pk/rss/',
      defaultCategory: 'Politics',
    },
  ];

  for (const feed of feeds) {
    try {
      const response = await axios.get(feed.url, {
        timeout: 6500,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
      });

      const $ = cheerio.load(response.data, { xmlMode: true });

      $('item').slice(0, 4).each((_, elem) => {
        const rawTitle = $(elem).find('title').text().trim();
        const link = $(elem).find('link').text().trim();
        const pubDate = $(elem).find('pubDate').text().trim();
        const rawDescription = $(elem).find('description').text().trim();

        // Extract thumbnail/image
        let imageUrl: string | null = null;
        const mediaThumbnail = $(elem).find('media\\:thumbnail').attr('url');
        const mediaContent = $(elem).find('media\\:content').attr('url');
        const enclosure = $(elem).find('enclosure').attr('url');

        if (mediaThumbnail) imageUrl = mediaThumbnail;
        else if (mediaContent) imageUrl = mediaContent;
        else if (enclosure) imageUrl = enclosure;

        const title = rawTitle.replace(/\s*-\s*(The News|ARY NEWS|SAMAA TV|Business Recorder|Daily Times|Pakistan Today)\s*$/i, '').trim();

        if (title && link) {
          const desc$ = cheerio.load(rawDescription);
          const bodySnippet = desc$.text().trim();

          const lower = title.toLowerCase();
          let category = feed.defaultCategory || 'Politics';

          if (lower.includes('tech') || lower.includes('ai') || lower.includes('software') || lower.includes('telecom') || lower.includes('digital') || lower.includes('5g')) {
            category = 'Technology & AI';
          } else if (lower.includes('economy') || lower.includes('rupee') || lower.includes('inflation') || lower.includes('sbp') || lower.includes('imf') || lower.includes('psx') || lower.includes('tax') || lower.includes('stock')) {
            category = 'Business & Economy';
          } else if (lower.includes('cricket') || lower.includes('pcb') || lower.includes('match') || lower.includes('trophy') || lower.includes('champions') || lower.includes('fifa')) {
            category = 'Sports';
          } else if (lower.includes('climate') || lower.includes('smog') || lower.includes('flood') || lower.includes('rain') || lower.includes('monsoon')) {
            category = 'Environment & Climate';
          } else if (lower.includes('health') || lower.includes('polio') || lower.includes('dengue') || lower.includes('hospital') || lower.includes('medical')) {
            category = 'Health';
          } else if (lower.includes('film') || lower.includes('drama') || lower.includes('music') || lower.includes('actor') || lower.includes('showbiz')) {
            category = 'Entertainment';
          } else if (lower.includes('education') || lower.includes('university') || lower.includes('exam') || lower.includes('hec') || lower.includes('school')) {
            category = 'Education';
          } else if (lower.includes('science') || lower.includes('suparco') || lower.includes('satellite') || lower.includes('space')) {
            category = 'Science';
          } else if (lower.includes('gaza') || lower.includes('us') || lower.includes('china') || lower.includes('un') || lower.includes('global') || lower.includes('india') || lower.includes('iran')) {
            category = 'World';
          }

          articles.push({
            title,
            body: bodySnippet.length > 30 ? bodySnippet : `${title}. Detailed Pakistani national coverage published by ${feed.sourceName}.`,
            sourceName: feed.sourceName,
            sourceUrl: link,
            category,
            imageUrl: imageUrl || getFallbackImageForCategory(category, title),
            publishedAt: pubDate || new Date().toISOString(),
          });
        }
      });
    } catch (err) {
      console.warn(`Pakistan scraper warning for ${feed.sourceName}:`, err);
    }
  }

  return articles;
}
