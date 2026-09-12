export interface ScrapedRawArticle {
  title: string;
  body: string;
  sourceName: 'Dawn' | 'The Express Tribune' | 'Geo News';
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
  summary: string[]; // 3-line summary
  sourceName: string;
  sourceUrl: string;
  category: string;
  imageUrl?: string | null;
  publishedAt: string;
  scrapedAt: string;
  isBreaking: boolean;
  relatedSources?: RelatedSource[];
}
