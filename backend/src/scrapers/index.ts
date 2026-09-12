import crypto from 'crypto';
import { scrapeDawnNews } from './dawn.js';
import { scrapeTribuneNews } from './tribune.js';
import { scrapeGeoNews } from './geo.js';
import { summarizeAndCategorizeArticle } from '../services/groq.js';
import { saveArticlesToFirestore } from '../services/firebase-admin.js';
import { sendBreakingNewsPushNotifications } from '../services/push.js';
import { ScrapedRawArticle, ProcessedArticle, RelatedSource } from '../types/index.js';

function generateArticleId(sourceName: string, title: string): string {
  const prefix = sourceName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const hash = crypto.createHash('md5').update(title.toLowerCase().trim()).digest('hex').slice(0, 10);
  return `${prefix}-${hash}`;
}

// Tokenize title into significant keywords for multi-source similarity matching
function getKeywords(title: string): Set<string> {
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
    'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
    'will', 'with', 'pakistan', 'news', 'says', 'after', 'over', 'new', 'more'
  ]);

  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  return new Set(words);
}

// Check if two articles from different sources cover the same story
function areArticlesRelated(titleA: string, titleB: string): boolean {
  const setA = getKeywords(titleA);
  const setB = getKeywords(titleB);

  let common = 0;
  for (const word of setA) {
    if (setB.has(word)) {
      common++;
    }
  }

  // If they share at least 2 strong keyword overlaps, they are likely covering the same topic
  return common >= 2;
}

export async function runScrapingPipeline(): Promise<{
  scrapedCount: number;
  processedCount: number;
  savedCount: number;
  articles: ProcessedArticle[];
}> {
  console.log('--- Starting Digestly Scraping Pipeline ---');

  // Step 1: Scrape all 3 publications in parallel
  const [dawnResult, tribuneResult, geoResult] = await Promise.allSettled([
    scrapeDawnNews(),
    scrapeTribuneNews(),
    scrapeGeoNews(),
  ]);

  const rawArticles: ScrapedRawArticle[] = [];

  if (dawnResult.status === 'fulfilled') {
    rawArticles.push(...dawnResult.value);
    console.log(`Scraped ${dawnResult.value.length} articles from Dawn`);
  } else {
    console.warn('Dawn scraper failed:', dawnResult.reason);
  }

  if (tribuneResult.status === 'fulfilled') {
    rawArticles.push(...tribuneResult.value);
    console.log(`Scraped ${tribuneResult.value.length} articles from The Express Tribune`);
  } else {
    console.warn('Tribune scraper failed:', tribuneResult.reason);
  }

  if (geoResult.status === 'fulfilled') {
    rawArticles.push(...geoResult.value);
    console.log(`Scraped ${geoResult.value.length} articles from Geo News`);
  } else {
    console.warn('Geo scraper failed:', geoResult.reason);
  }

  console.log(`Total raw articles collected: ${rawArticles.length}`);

  // Step 2: Build cross-source topic links (Multi-Source Comparison)
  const relatedMap = new Map<string, RelatedSource[]>();

  for (let i = 0; i < rawArticles.length; i++) {
    const artA = rawArticles[i];
    const relatedList: RelatedSource[] = [];

    for (let j = 0; j < rawArticles.length; j++) {
      if (i === j) continue;
      const artB = rawArticles[j];

      // Only link different sources
      if (artA.sourceName !== artB.sourceName && areArticlesRelated(artA.title, artB.title)) {
        relatedList.push({
          sourceName: artB.sourceName,
          sourceUrl: artB.sourceUrl,
          headline: artB.title,
          angleHighlight: `Framed by ${artB.sourceName} with focus on regional developments.`,
        });
      }
    }

    if (relatedList.length > 0) {
      relatedMap.set(artA.title, relatedList.slice(0, 3));
    }
  }

  // Step 3: Summarize via Groq API (or smart fallback) and format
  const processedArticles: ProcessedArticle[] = [];

  // Limit batch size per run to avoid rate limits (top 15 articles)
  const batchToProcess = rawArticles.slice(0, 15);

  for (const raw of batchToProcess) {
    try {
      const { summary, paragraphSummary, highlightPhrases, category, isBreaking } =
        await summarizeAndCategorizeArticle(raw);
      const id = generateArticleId(raw.sourceName, raw.title);
      const related = relatedMap.get(raw.title) || [];

      processedArticles.push({
        id,
        title: raw.title,
        summary,
        paragraphSummary,
        highlightPhrases,
        sourceName: raw.sourceName,
        sourceUrl: raw.sourceUrl,
        category,
        imageUrl: raw.imageUrl,
        publishedAt: raw.publishedAt,
        scrapedAt: new Date().toISOString(),
        isBreaking,
        relatedSources: related,
      });
    } catch (err) {
      console.warn(`Failed to process article "${raw.title}":`, err);
    }
  }

  console.log(`Successfully summarized ${processedArticles.length} articles`);

  // Step 4: Save to Firestore
  const { saved } = await saveArticlesToFirestore(processedArticles);
  console.log(`Saved ${saved} articles to Firestore`);

  // Step 5: Send push notifications for breaking articles
  const breakingArticles = processedArticles.filter((a) => a.isBreaking);
  if (breakingArticles.length > 0) {
    console.log(`Detected ${breakingArticles.length} breaking news articles, dispatching push notifications...`);
    await sendBreakingNewsPushNotifications(breakingArticles);
  }

  return {
    scrapedCount: rawArticles.length,
    processedCount: processedArticles.length,
    savedCount: saved,
    articles: processedArticles,
  };
}
