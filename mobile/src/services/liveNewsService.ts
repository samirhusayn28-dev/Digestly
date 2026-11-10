import AsyncStorage from '@react-native-async-storage/async-storage';
import { Article } from '../navigation/types';
import { getCategoryFallbackUri } from '../utils/imageHelper';

interface LiveFeedSource {
  sourceName: string;
  category: string;
  url: string;
}

const LIVE_FEEDS: LiveFeedSource[] = [
  // Top Pakistani Outlets
  {
    sourceName: 'Dawn',
    category: 'Politics',
    url: 'https://www.dawn.com/feeds/latest-news/',
  },
  {
    sourceName: 'The Express Tribune',
    category: 'Politics',
    url: 'https://tribune.com.pk/feed/latest',
  },
  {
    sourceName: 'Geo News',
    category: 'Politics',
    url: 'https://www.geo.tv/rss/1/1',
  },
  {
    sourceName: 'The News International',
    category: 'Politics',
    url: 'https://www.thenews.com.pk/rss/1/1',
  },
  {
    sourceName: 'Business Recorder',
    category: 'Business & Economy',
    url: 'https://www.brecorder.com/feeds/latest-news/',
  },
  {
    sourceName: 'ARY News',
    category: 'Politics',
    url: 'https://arynews.tv/feed/',
  },
  {
    sourceName: 'Samaa TV',
    category: 'Politics',
    url: 'https://news.google.com/rss/search?q=site:samaa.tv+when:2d&hl=en-PK&gl=PK&ceid=PK:en',
  },
  {
    sourceName: 'Dunya News',
    category: 'Politics',
    url: 'https://news.google.com/rss/search?q=site:dunyanews.tv+when:2d&hl=en-PK&gl=PK&ceid=PK:en',
  },

  // Category Specific Streams
  {
    sourceName: 'Dawn Business',
    category: 'Business & Economy',
    url: 'https://www.dawn.com/feeds/business/',
  },
  {
    sourceName: 'Google Tech',
    category: 'Technology & AI',
    url: 'https://news.google.com/rss/search?q=technology+AI+when:2d&hl=en-PK&gl=PK&ceid=PK:en',
  },
  {
    sourceName: 'Dawn Sports',
    category: 'Sports',
    url: 'https://www.dawn.com/feeds/sport/',
  },
  {
    sourceName: 'Google Climate',
    category: 'Environment & Climate',
    url: 'https://news.google.com/rss/search?q=Pakistan+climate+environment+when:3d&hl=en-PK&gl=PK&ceid=PK:en',
  },
  {
    sourceName: 'Google Health',
    category: 'Health',
    url: 'https://news.google.com/rss/search?q=health+medical+when:3d&hl=en-PK&gl=PK&ceid=PK:en',
  },
  {
    sourceName: 'Google Science',
    category: 'Science',
    url: 'https://news.google.com/rss/search?q=science+space+when:3d&hl=en-PK&gl=PK&ceid=PK:en',
  },

  // International Outlets
  {
    sourceName: 'BBC World',
    category: 'World',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
  },
  {
    sourceName: 'CNN',
    category: 'World',
    url: 'http://rss.cnn.com/rss/edition_world.rss',
  },
  {
    sourceName: 'Reuters',
    category: 'World',
    url: 'https://news.google.com/rss/search?q=source:Reuters+when:1d&hl=en-US&gl=US&ceid=US:en',
  },
  {
    sourceName: 'Al Jazeera',
    category: 'World',
    url: 'https://news.google.com/rss/search?q=source:%22Al+Jazeera%22+when:1d&hl=en-US&gl=US&ceid=US:en',
  },
  {
    sourceName: 'Associated Press',
    category: 'World',
    url: 'https://news.google.com/rss/search?q=source:%22Associated+Press%22+when:1d&hl=en-US&gl=US&ceid=US:en',
  },
];

const CACHE_KEY = '@digestly_live_news_cache_v1';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache

// Helper: Calculate relative time (e.g., '12m ago', '2h ago')
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Just now';
  const pubTime = new Date(dateString).getTime();
  if (isNaN(pubTime)) return 'Recently';

  const diffMs = Date.now() - pubTime;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return `${Math.floor(diffDays / 7)}w ago`;
}

// Clean HTML tags and entities
function cleanHtml(html: string): string {
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate 3 concise summary bullets from article title and description
function generateBulletsFromText(title: string, desc: string): string[] {
  const cleanDesc = cleanHtml(desc);
  const sentences = cleanDesc
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  if (sentences.length >= 3) {
    return [sentences[0], sentences[1], sentences[2]];
  } else if (sentences.length === 2) {
    return [
      sentences[0],
      sentences[1],
      `${title} represents a notable development reported across national coverage.`,
    ];
  } else if (sentences.length === 1) {
    return [
      sentences[0],
      `${title} was published with urgent priority by regional editorial desks.`,
      'Ongoing developments are being monitored as additional context emerges.',
    ];
  }

  return [
    title,
    'Official representatives released preliminary information regarding this development.',
    'Further analytical commentary and sector reactions are anticipated shortly.',
  ];
}

// Parse single RSS/Atom XML string into Article array
function parseRssFeed(xml: string, feed: LiveFeedSource): Article[] {
  const articles: Article[] = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  let count = 0;

  while ((match = itemRegex.exec(xml)) !== null && count < 6) {
    const itemContent = match[1];

    // Title
    const titleMatch = itemContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    let title = titleMatch ? cleanHtml(titleMatch[1]) : '';
    title = title
      .replace(/\s*-\s*(Dawn|The Express Tribune|Geo News|The News|ARY NEWS|SAMAA TV|Business Recorder|BBC News)\s*$/i, '')
      .replace(/\s*\|\s*Al Jazeera\s*$/i, '')
      .trim();

    if (!title) continue;

    // Link
    const linkMatch = itemContent.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || itemContent.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
    const sourceUrl = linkMatch ? cleanHtml(linkMatch[1]) : 'https://www.google.com';

    // PubDate
    const pubDateMatch = itemContent.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
    const pubDateStr = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();

    // Description
    const descMatch = itemContent.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
    const rawDesc = descMatch ? descMatch[1] : '';
    const cleanDesc = cleanHtml(rawDesc);

    // Image URL extraction
    let imageUrl: string | null = null;
    const mediaContentMatch = itemContent.match(/<media:content[^>]+url=["']([^"']+)["']/i);
    const mediaThumbnailMatch = itemContent.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
    const enclosureMatch = itemContent.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
    const imgTagMatch = rawDesc.match(/<img[^>]+src=["']([^"']+)["']/i);

    if (mediaContentMatch) imageUrl = mediaContentMatch[1];
    else if (mediaThumbnailMatch) imageUrl = mediaThumbnailMatch[1];
    else if (enclosureMatch) imageUrl = enclosureMatch[1];
    else if (imgTagMatch) imageUrl = imgTagMatch[1];

    const articleId = `live-${feed.sourceName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${count}-${Date.now().toString(36)}`;
    const finalImage = imageUrl || getCategoryFallbackUri(feed.category, articleId);

    // Dynamic category resolution
    let resolvedCategory = feed.category;
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('cricket') || lowerTitle.includes('psl') || lowerTitle.includes('fifa') || lowerTitle.includes('match') || lowerTitle.includes('olympics')) {
      resolvedCategory = 'Sports';
    } else if (lowerTitle.includes('tech') || lowerTitle.includes('ai') || lowerTitle.includes('software') || lowerTitle.includes('google') || lowerTitle.includes('apple') || lowerTitle.includes('cyber')) {
      resolvedCategory = 'Technology & AI';
    } else if (lowerTitle.includes('economy') || lowerTitle.includes('inflation') || lowerTitle.includes('rupee') || lowerTitle.includes('sbp') || lowerTitle.includes('stocks') || lowerTitle.includes('market') || lowerTitle.includes('tax')) {
      resolvedCategory = 'Business & Economy';
    } else if (lowerTitle.includes('climate') || lowerTitle.includes('flood') || lowerTitle.includes('smog') || lowerTitle.includes('rain') || lowerTitle.includes('heatwave')) {
      resolvedCategory = 'Environment & Climate';
    } else if (lowerTitle.includes('health') || lowerTitle.includes('virus') || lowerTitle.includes('dengue') || lowerTitle.includes('hospital') || lowerTitle.includes('polio')) {
      resolvedCategory = 'Health';
    }

    const summaryBullets = generateBulletsFromText(title, cleanDesc);

    articles.push({
      id: articleId,
      title,
      summary: summaryBullets,
      paragraphSummary: cleanDesc.length > 50 ? cleanDesc : `${title}. Reported live by ${feed.sourceName}.`,
      highlightPhrases: [feed.sourceName, resolvedCategory],
      sourceName: feed.sourceName.replace(/^Google\s+/, ''),
      sourceUrl,
      category: resolvedCategory,
      imageUrl: finalImage,
      publishedAt: formatRelativeTime(pubDateStr),
      scrapedAt: new Date().toISOString(),
      isBreaking: count === 0,
      relatedSources: [],
    });

    count++;
  }

  return articles;
}

// Fetch a single feed with timeout
async function fetchSingleFeed(feed: LiveFeedSource): Promise<Article[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const response = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) return [];
    const text = await response.text();
    return parseRssFeed(text, feed);
  } catch {
    return [];
  }
}

/**
 * Main Live News Service: Fetches breaking real-time news directly on device
 */
export async function getLiveNewsArticles(options: {
  category?: string;
  source?: string;
  forceRefresh?: boolean;
} = {}): Promise<Article[]> {
  const { category = 'All', source = 'all', forceRefresh = false } = options;

  // 1. Try reading from memory/AsyncStorage cache if not forcing refresh
  if (!forceRefresh) {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp, articles } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS && Array.isArray(articles) && articles.length > 0) {
          return filterArticles(articles, category, source);
        }
      }
    } catch {
      // Proceed to live network fetch
    }
  }

  // 2. Select relevant feeds to fetch in parallel
  let selectedFeeds = LIVE_FEEDS;
  if (category !== 'All') {
    selectedFeeds = LIVE_FEEDS.filter(
      (f) => f.category.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(f.category.toLowerCase())
    );
    if (selectedFeeds.length === 0) {
      selectedFeeds = LIVE_FEEDS.slice(0, 6);
    }
  }

  // Fetch feeds in parallel
  const results = await Promise.allSettled(selectedFeeds.map((feed) => fetchSingleFeed(feed)));
  const allArticles: Article[] = [];

  for (const res of results) {
    if (res.status === 'fulfilled' && res.value.length > 0) {
      allArticles.push(...res.value);
    }
  }

  // Deduplicate by title similarity
  const seenTitles = new Set<string>();
  const uniqueArticles: Article[] = [];

  for (const art of allArticles) {
    const key = art.title.toLowerCase().slice(0, 30);
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      uniqueArticles.push(art);
    }
  }

  // Save to cache
  if (uniqueArticles.length > 0) {
    try {
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          articles: uniqueArticles,
        })
      );
    } catch {
      // Non-critical cache error
    }
  }

  return filterArticles(uniqueArticles, category, source);
}

// Filter articles by category and source
function filterArticles(articles: Article[], category: string, source: string): Article[] {
  return articles.filter((item) => {
    // Category Filter
    if (category !== 'All') {
      const itemCat = item.category.toLowerCase().replace(/&/g, 'and').trim();
      const selCat = category.toLowerCase().replace(/&/g, 'and').trim();
      if (!itemCat.includes(selCat) && !selCat.includes(itemCat)) return false;
    }

    // Source Filter
    if (source !== 'all') {
      const itemSrc = item.sourceName.toLowerCase();
      const targetSrc = source.toLowerCase();

      const normItem = itemSrc.replace(/^(the\s+)/, '').replace(/\s+(news|tv|hd|international|today|times)\b/g, '').trim();
      const normTarget = targetSrc.replace(/^(the\s+)/, '').replace(/\s+(news|tv|hd|international|today|times)\b/g, '').trim();

      const matches =
        itemSrc.includes(targetSrc) ||
        targetSrc.includes(itemSrc) ||
        normItem.includes(normTarget) ||
        normTarget.includes(normItem);

      if (!matches) return false;
    }

    return true;
  });
}
