import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runScrapingPipeline } from '../src/scrapers/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();

  try {
    const result = await runScrapingPipeline();
    const durationMs = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      message: 'Scraping and Groq summarization completed successfully',
      timestamp: new Date().toISOString(),
      durationMs,
      metrics: {
        rawScraped: result.scrapedCount,
        summarized: result.processedCount,
        persistedToFirestore: result.savedCount,
      },
      sample: result.articles.slice(0, 2),
    });
  } catch (error: any) {
    console.error('Manual scrape endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Scraping execution failed',
      durationMs: Date.now() - startTime,
    });
  }
}
