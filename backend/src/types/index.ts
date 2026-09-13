export interface ScrapedRawArticle {
  title: string;
  body: string;
  sourceName: 'Dawn' | 'The Express Tribune' | 'Geo News' | 'BBC World' | 'Al Jazeera' | string;
  sourceUrl: string;
  category?: string;
  imageUrl?: string | null;
  publishedAt: string;
}

export interface RelatedSource {
  sourceName: string;
  sourceUrl: string;
  headline: string;
  angleHighlight?: string;
}

export interface ProcessedArticle {
  id: string;
  title: string;
  summary: string[]; // Key Points (3-4 concise bullet points)
  paragraphSummary?: string; // 4-6 sentences full condensed news paragraph
  highlightPhrases?: string[]; // 3-5 key phrases to highlight in yellow
  sourceName: string;
  sourceUrl: string;
  category: string;
  imageUrl?: string | null;
  publishedAt: string;
  scrapedAt: string;
  isBreaking: boolean;
  relatedSources?: RelatedSource[];
}
