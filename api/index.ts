import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    name: 'Digestly News API',
    status: 'online',
    version: '1.0.0',
    description: 'Serverless news scraper and Groq AI summarizer for Pakistani publications',
    endpoints: {
      health: '/api/health',
      manualScrape: '/api/scrape',
      cronScrape: '/api/cron/scrape',
    },
    documentation: 'https://github.com/samirhusayn28-dev/Digestly/blob/main/DEPLOYMENT.md',
  });
}
