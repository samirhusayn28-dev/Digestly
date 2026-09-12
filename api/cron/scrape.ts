import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runScrapingPipeline } from '../../backend/src/scrapers/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify Vercel Cron authorization if configured
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized cron request' });
  }

  const startTime = Date.now();

  try {
    const result = await runScrapingPipeline();
    const durationMs = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs,
      scrapedCount: result.scrapedCount,
      processedCount: result.processedCount,
      savedCount: result.savedCount,
      articlesSample: result.articles.slice(0, 3).map((a) => ({
        id: a.id,
        title: a.title,
        source: a.sourceName,
        category: a.category,
        summaryLines: a.summary.length,
        perspectives: a.relatedSources?.length || 0,
      })),
    });
  } catch (error: any) {
    console.error('Cron scrape pipeline error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal scraping error',
      durationMs: Date.now() - startTime,
    });
  }
}
