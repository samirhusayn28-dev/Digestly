import Groq from 'groq-sdk';
import { ScrapedRawArticle, ProcessedArticle } from '../types/index.js';

// Access Groq key via NEWS_API_KEY:
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
  summary: string[];
  category: string;
  isBreaking: boolean;
}

const VALID_CATEGORIES = ['Politics', 'Business', 'Tech', 'Sports', 'World', 'Entertainment'];

export async function summarizeAndCategorizeArticle(
  article: ScrapedRawArticle
): Promise<SummarizeResult> {
  const groq = getGroqClient();

  // If no Groq API key is present in current environment (e.g. testing before Vercel deploy)
  if (!groq) {
    return fallbackSummarizer(article);
  }

  const prompt = `You are the lead editor for Digestly, a premier news aggregator for Pakistan.
Analyze the following Pakistani news story from ${article.sourceName} and provide:
1. A concise, factual 3-line summary (exactly 3 bullet points, each 1 sentence, containing high-density facts: names, numbers, events, and key outcomes).
2. The best-matching category strictly from this list: [Politics, Business, Tech, Sports, World, Entertainment].
3. Whether this is high-urgency breaking news (true/false).

Title: ${article.title}
Source Category: ${article.category || 'Unknown'}
Article Content:
${article.body.slice(0, 3000)}

Respond in valid JSON only with this structure:
{
  "summary": [
    "First line focusing on the main development with key figures or names.",
    "Second line covering the context or causes.",
    "Third line highlighting the future impact or stated next steps."
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
      const category = VALID_CATEGORIES.includes(parsed.category)
        ? parsed.category
        : article.category && VALID_CATEGORIES.includes(article.category)
        ? article.category
        : 'Politics';

      const summaryLines = Array.isArray(parsed.summary) && parsed.summary.length === 3
        ? parsed.summary
        : Array.isArray(parsed.summary)
        ? parsed.summary.slice(0, 3)
        : [article.title];

      return {
        summary: summaryLines,
        category,
        isBreaking: Boolean(parsed.isBreaking),
      };
    }
  } catch (error) {
    console.warn(`Groq API summarization error for "${article.title}":`, error);
  }

  return fallbackSummarizer(article);
}

// Fallback heuristic summarizer if API key is not yet set or during offline testing
function fallbackSummarizer(article: ScrapedRawArticle): SummarizeResult {
  const sentences = article.body
    .replace(/\s+/g, ' ')
    .split(/(?<=[.?!])\s+/)
    .filter((s) => s.length > 20 && !s.toLowerCase().includes('click here') && !s.toLowerCase().includes('subscribe'));

  const summary = sentences.slice(0, 3);
  if (summary.length < 3) {
    summary.push(article.title);
    while (summary.length < 3) {
      summary.push('Further updates on this developing story are expected from official spokespersons.');
    }
  }

  // Detect category from keywords
  let category = article.category || 'Politics';
  const lowerTitle = article.title.toLowerCase();
  const lowerBody = article.body.toLowerCase();

  if (lowerTitle.includes('cricket') || lowerTitle.includes('pcb') || lowerTitle.includes('psl') || lowerTitle.includes('match')) {
    category = 'Sports';
  } else if (lowerTitle.includes('economy') || lowerTitle.includes('sbp') || lowerTitle.includes('inflation') || lowerTitle.includes('psx') || lowerTitle.includes('rupee')) {
    category = 'Business';
  } else if (lowerTitle.includes('ai') || lowerTitle.includes('tech') || lowerTitle.includes('software') || lowerTitle.includes('startup') || lowerTitle.includes('telecom')) {
    category = 'Tech';
  } else if (lowerTitle.includes('film') || lowerTitle.includes('cinema') || lowerTitle.includes('coke studio') || lowerTitle.includes('actor') || lowerTitle.includes('music')) {
    category = 'Entertainment';
  } else if (lowerTitle.includes('israel') || lowerTitle.includes('gaza') || lowerTitle.includes('us') || lowerTitle.includes('un') || lowerTitle.includes('china') || lowerTitle.includes('global')) {
    category = 'World';
  }

  const isBreaking = lowerTitle.includes('breaking') || lowerTitle.includes('urgent') || lowerTitle.includes('sc earthquake') || lowerTitle.includes('killed') || lowerTitle.includes('crash');

  return {
    summary: summary.slice(0, 3),
    category: VALID_CATEGORIES.includes(category) ? category : 'Politics',
    isBreaking,
  };
}
