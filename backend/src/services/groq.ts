import Groq from 'groq-sdk';
import { ScrapedRawArticle, ProcessedArticle } from '../types/index.js';

// Access Groq key via NEWS_API_KEY
const getGroqApiKey = (): string | undefined => {
  return process.env.NEWS_API_KEY;
};

let groqClientInstance: Groq | null = null;

function getGroqClient(): Groq | null {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    return null;
  }
  if (!groqClientInstance) {
    groqClientInstance = new Groq({ apiKey });
  }
  return groqClientInstance;
}

export interface SummarizeResult {
  summary: string[]; // 3-4 concise key points
  paragraphSummary: string; // 4-6 sentences cohesive editorial prose
  highlightPhrases: string[]; // 3-5 key terms/numbers/names to highlight
  category: string;
  isBreaking: boolean;
}

export const OFFICIAL_CATEGORIES = [
  'Politics',
  'Business & Economy',
  'Technology & AI',
  'Sports',
  'World',
  'Health',
  'Entertainment',
  'Education',
  'Environment & Climate',
  'Science',
] as const;

export function normalizeCategory(cat?: string): string {
  if (!cat) return 'Politics';
  const clean = cat.trim();
  if (clean === 'Business') return 'Business & Economy';
  if (clean === 'Tech' || clean === 'Technology' || clean === 'AI') return 'Technology & AI';
  if (clean === 'Environment' || clean === 'Climate') return 'Environment & Climate';
  if (OFFICIAL_CATEGORIES.includes(clean as any)) return clean;
  return 'Politics';
}

export async function summarizeAndCategorizeArticle(
  article: ScrapedRawArticle
): Promise<SummarizeResult> {
  const groq = getGroqClient();

  if (!groq) {
    return fallbackSummarizer(article);
  }

  const prompt = `You are the chief news editor for Digestly, a premier news briefing app for Pakistan and global affairs.
Analyze the following news story from ${article.sourceName} and provide:
1. "paragraphSummary": A substantial, cohesive editorial prose paragraph of 4 to 6 complete sentences summarizing the entire story with depth, journalistic clarity, and context.
2. "highlightPhrases": An array of 3 to 5 exact key phrases or numbers (e.g., person names, government bodies, monetary amounts, critical dates, or decisive events) present word-for-word in your "paragraphSummary" that should be highlighted in yellow for skim-reading.
3. "summary": An array of exactly 3 to 4 concise bullet points (Key Points), each 1 sentence long, capturing high-density facts (names, numbers, events, and key outcomes).
4. "category": The best-matching category strictly from this 10-category list: [Politics, Business & Economy, Technology & AI, Sports, World, Health, Entertainment, Education, Environment & Climate, Science].
5. "isBreaking": Whether this is urgent, high-consequence breaking news (true/false).

Title: ${article.title}
Source Category: ${article.category || 'Unknown'}
Article Content:
${article.body.slice(0, 3500)}

Respond in valid JSON only with this structure:
{
  "paragraphSummary": "A detailed 4-6 sentence editorial prose paragraph...",
  "highlightPhrases": ["phrase 1", "phrase 2", "phrase 3"],
  "summary": [
    "First concise key point with figures or names.",
    "Second key point covering causes or context.",
    "Third key point covering impact or next steps."
  ],
  "category": "Politics",
  "isBreaking": false
}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      const category = normalizeCategory(parsed.category || article.category);

      const summaryLines = Array.isArray(parsed.summary) && parsed.summary.length >= 2
        ? parsed.summary.slice(0, 4)
        : [article.title];

      const paragraphSummary =
        typeof parsed.paragraphSummary === 'string' && parsed.paragraphSummary.length > 50
          ? parsed.paragraphSummary.trim()
          : summaryLines.join(' ');

      const highlightPhrases = Array.isArray(parsed.highlightPhrases)
        ? parsed.highlightPhrases.filter((h: any) => typeof h === 'string' && h.trim().length > 1).slice(0, 5)
        : [];

      return {
        summary: summaryLines,
        paragraphSummary,
        highlightPhrases,
        category,
        isBreaking: Boolean(parsed.isBreaking),
      };
    }
  } catch (error) {
    console.warn(`Groq API summarization error for "${article.title}":`, error);
  }

  return fallbackSummarizer(article);
}

// Fallback heuristic summarizer if API key is not present or during offline testing
function fallbackSummarizer(article: ScrapedRawArticle): SummarizeResult {
  const cleanBody = article.body.replace(/\s+/g, ' ').trim();
  const sentences = cleanBody
    .split(/(?<=[.?!])\s+/)
    .filter(
      (s) =>
        s.length > 25 &&
        !s.toLowerCase().includes('click here') &&
        !s.toLowerCase().includes('subscribe') &&
        !s.toLowerCase().includes('read more')
    );

  // Build 4-sentence paragraph summary
  let paragraphSentences = sentences.slice(0, 4);
  if (paragraphSentences.length < 2) {
    paragraphSentences = [
      article.title + '.',
      `${article.sourceName} reports that official discussions and regional reviews are currently underway regarding this development.`,
      'Key stakeholders have emphasized the broader implications for policy and public interest.',
      'Further official updates and detailed statements are expected as the situation progresses.',
    ];
  }
  const paragraphSummary = paragraphSentences.join(' ');

  // Build 3 bullet points for key points
  const summary = sentences.slice(0, 3);
  if (summary.length < 3) {
    summary.push(article.title);
    while (summary.length < 3) {
      summary.push('Further updates on this developing story are expected from official spokespersons.');
    }
  }

  // Extract highlight phrases (proper nouns, figures, acronyms)
  const highlightSet = new Set<string>();
  const acronyms = paragraphSummary.match(/\b[A-Z]{2,6}\b/g) || [];
  acronyms.forEach((a) => highlightSet.add(a));

  const numbers = paragraphSummary.match(/\b\d+(?:[\.,]\d+)?(?:\s?(?:percent|billion|million|trillion|rupees|USD))?\b/gi) || [];
  numbers.slice(0, 2).forEach((n) => highlightSet.add(n));

  const capitalizedWords = paragraphSummary.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b/g) || [];
  capitalizedWords
    .filter((w) => !['The', 'A', 'An', 'In', 'On', 'At', 'With', 'However', 'According', 'Further'].includes(w))
    .slice(0, 2)
    .forEach((w) => highlightSet.add(w));

  const highlightPhrases = Array.from(highlightSet).slice(0, 4);

  // Detect category
  let category = normalizeCategory(article.category);
  const lowerTitle = article.title.toLowerCase();

  if (lowerTitle.includes('cricket') || lowerTitle.includes('pcb') || lowerTitle.includes('psl') || lowerTitle.includes('match') || lowerTitle.includes('football')) {
    category = 'Sports';
  } else if (lowerTitle.includes('economy') || lowerTitle.includes('sbp') || lowerTitle.includes('inflation') || lowerTitle.includes('psx') || lowerTitle.includes('rupee') || lowerTitle.includes('imf') || lowerTitle.includes('trade')) {
    category = 'Business & Economy';
  } else if (lowerTitle.includes('ai') || lowerTitle.includes('tech') || lowerTitle.includes('software') || lowerTitle.includes('startup') || lowerTitle.includes('telecom') || lowerTitle.includes('digital')) {
    category = 'Technology & AI';
  } else if (lowerTitle.includes('film') || lowerTitle.includes('cinema') || lowerTitle.includes('actor') || lowerTitle.includes('music') || lowerTitle.includes('drama') || lowerTitle.includes('show')) {
    category = 'Entertainment';
  } else if (lowerTitle.includes('israel') || lowerTitle.includes('gaza') || lowerTitle.includes('us') || lowerTitle.includes('un') || lowerTitle.includes('china') || lowerTitle.includes('global') || lowerTitle.includes('brics') || lowerTitle.includes('war')) {
    category = 'World';
  } else if (lowerTitle.includes('health') || lowerTitle.includes('polio') || lowerTitle.includes('vaccine') || lowerTitle.includes('hospital') || lowerTitle.includes('disease')) {
    category = 'Health';
  } else if (lowerTitle.includes('climate') || lowerTitle.includes('flood') || lowerTitle.includes('smog') || lowerTitle.includes('environment') || lowerTitle.includes('carbon')) {
    category = 'Environment & Climate';
  } else if (lowerTitle.includes('school') || lowerTitle.includes('university') || lowerTitle.includes('student') || lowerTitle.includes('education') || lowerTitle.includes('exam')) {
    category = 'Education';
  } else if (lowerTitle.includes('science') || lowerTitle.includes('space') || lowerTitle.includes('nasa') || lowerTitle.includes('research') || lowerTitle.includes('physics')) {
    category = 'Science';
  }

  const isBreaking = lowerTitle.includes('breaking') || lowerTitle.includes('urgent') || lowerTitle.includes('earthquake') || lowerTitle.includes('blast') || lowerTitle.includes('killed');

  return {
    summary: summary.slice(0, 3),
    paragraphSummary,
    highlightPhrases,
    category,
    isBreaking,
  };
}
