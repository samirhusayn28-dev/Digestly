import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const hasGroqKey = Boolean(process.env.NEWS_API_KEY);
  const hasFirebaseProject = Boolean(process.env.FIREBASE_PROJECT_ID || 'digestly-cbe3c');

  return res.status(200).json({
    status: 'online',
    service: 'Digestly Backend Scraper & Summarizer',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    config: {
      groqKeyConfigured: hasGroqKey,
      firebaseProject: process.env.FIREBASE_PROJECT_ID || 'digestly-cbe3c',
      cronSchedule: '0 1 * * * (Daily at 01:00 UTC / 06:00 PKT)',
    },
  });
}
