import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  doc,
  setDoc,
  DocumentSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Article } from '../navigation/types';

export const REALISTIC_SEED_ARTICLES: Article[] = [
  {
    id: 'sbp-rate-decision-2025',
    title: 'State Bank Maintains Benchmark Policy Rate at 11% Amid Disinflation Trend',
    paragraphSummary:
      'The State Bank of Pakistan decided to maintain its benchmark policy rate unchanged at 11% during Saturday’s monetary policy review. Officials cited steady disinflation and an improving current account balance as decisive factors supporting economic stabilization. The central bank emphasized that while industrial output has shown signs of recovery, cautious vigilance is required against global commodity fluctuations. Key analysts project that gradual easing could begin later in the fiscal cycle if inflationary pressures remain anchored.',
    highlightPhrases: ['State Bank of Pakistan', '11%', 'steady disinflation', 'monetary policy review'],
    summary: [
      'The Monetary Policy Committee noted that headline CPI has stabilized within the medium-term 5–7% range.',
      'A persistent current account surplus and disciplined fiscal policy supported currency stabilization at 278/USD.',
      'Industrial large-scale manufacturing posted modest recovery despite elevated borrowing costs for SMEs.',
    ],
    sourceName: 'Dawn',
    sourceUrl: 'https://www.dawn.com/news/1879001',
    category: 'Business',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
    publishedAt: '25m ago',
    scrapedAt: new Date().toISOString(),
    isBreaking: true,
    relatedSources: [
      {
        sourceName: 'The Express Tribune',
        sourceUrl: 'https://tribune.com.pk/story/249001/sbp-status-quo',
        headline: 'SBP stays the course on interest rates to guard against external commodity shocks',
        angleHighlight: 'Emphasizes cautionary stance against volatile global crude oil prices.',
      },
      {
        sourceName: 'Geo News',
        sourceUrl: 'https://geo.tv/latest/sbp-rate-11',
        headline: 'Governor SBP: Inflation under control, rate cuts to be calibrated carefully in Q2',
        angleHighlight: 'Focuses on comments regarding prospective rate easing in upcoming quarters.',
      },
    ],
  },
  {
    id: 'it-exports-cross-record',
    title: 'Pakistan Tech Export Receipts Hit All-Time High of $3.2B in Fiscal Run',
    paragraphSummary:
      'Pakistan’s information technology export receipts surged to an all-time record of $3.2 billion over the ongoing fiscal period. The impressive 28% year-on-year growth was driven primarily by freelance engineering talent and expanding global cloud computing agreements. Ministry officials noted that streamlined foreign currency retention protocols enacted by the central bank have incentivized tech enterprises to repatriate overseas earnings. New technological incubation zones across Islamabad and Lahore contributed substantially to the milestone tally.',
    highlightPhrases: ['$3.2 billion', '28% year-on-year', 'cloud computing agreements', 'Islamabad and Lahore'],
    summary: [
      'IT remittances expanded 28% year-on-year, driven by freelance software engineers and enterprise cloud contracts.',
      'Special Technology Zones (STZ) in Islamabad and Lahore contributed over $650M in exports during H1.',
      'State Bank simplified foreign currency retention rules, allowing tech firms to keep 50% in overseas accounts.',
    ],
    sourceName: 'The Express Tribune',
    sourceUrl: 'https://tribune.com.pk/story/249002/tech-exports-surge',
    category: 'Tech',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
    publishedAt: '1h ago',
    scrapedAt: new Date().toISOString(),
    isBreaking: false,
    relatedSources: [
      {
        sourceName: 'Dawn',
        sourceUrl: 'https://www.dawn.com/news/1879002',
        headline: 'Software exports outpace traditional sectors as Pakistan accelerates digital workforce',
        angleHighlight: 'Highlights remote developer hubs in Faisalabad, Multan, and Peshawar.',
      },
      {
        sourceName: 'Geo News',
        sourceUrl: 'https://geo.tv/latest/tech-exports-pakistan',
        headline: 'IT Minister pledges broadband expansion across 45 underserved districts by year-end',
        angleHighlight: 'Spotlights government infrastructure pledges and 5G spectrum roadmap.',
      },
    ],
  },
  {
    id: 'champions-trophy-lahore',
    title: 'Qaddafi Stadium Unveils State-of-the-Art Pavilion Ahead of Champions Trophy',
    paragraphSummary:
      'The Pakistan Cricket Board officially inaugurated the refurbished 38,000-seat main pavilion at Qaddafi Stadium in Lahore. The venue underwent extensive structural modernization to meet international standards for the forthcoming Champions Trophy tournament. International Cricket Council inspectors expressed complete satisfaction with pitch quality, floodlight luminance, and athlete facilities during their final venue review. Opening fixture tickets were rapidly snapped up within minutes of box office availability.',
    highlightPhrases: ['Pakistan Cricket Board', 'Qaddafi Stadium', 'Champions Trophy', '38,000-seat'],
    summary: [
      'The Pakistan Cricket Board inaugurated the newly renovated 38,000-capacity pavilion in Lahore.',
      'ICC venue inspection delegation gave unconditional approval to pitch, lighting, and player enclosure standards.',
      'Tickets for opening fixtures against New Zealand and South Africa sold out within 45 minutes of release.',
    ],
    sourceName: 'Geo News',
    sourceUrl: 'https://geo.tv/sports/champions-trophy-lahore-stadium',
    category: 'Sports',
    imageUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=600&q=80',
    publishedAt: '2h ago',
    scrapedAt: new Date().toISOString(),
    isBreaking: false,
    relatedSources: [
      {
        sourceName: 'Dawn',
        sourceUrl: 'https://www.dawn.com/news/1879003',
        headline: 'Lahore ready for marquee cricket tournament as international security review passes smoothly',
        angleHighlight: 'Focuses on foolproof protocol arrangements and hospitality corridors.',
      },
      {
        sourceName: 'The Express Tribune',
        sourceUrl: 'https://tribune.com.pk/story/249003/qaddafi-renovation',
        headline: 'Modern LED towers and replay screens elevate spectator experience at historic venue',
        angleHighlight: 'Details architectural enhancements and digital ticketing gates.',
      },
    ],
  },
  {
    id: 'electoral-reforms-parliament',
    title: 'Parliamentary Committee Reaches Consensus on Digital Voting Machine Framework',
    paragraphSummary:
      'Lawmakers across treasury and opposition benches reached formal consensus on a standardized digital voting architecture for future electoral cycles. The joint parliamentary committee ratified technical specifications that mandate open-source cryptographic auditability. Under the phased roadmap, registered overseas Pakistanis in selected trial regions will gain access to an encrypted i-voting platform during provincial by-elections. NADRA and the Election Commission will coordinate data sovereignty protocols.',
    highlightPhrases: ['formal consensus', 'digital voting architecture', 'overseas Pakistanis', 'NADRA'],
    summary: [
      'Treasury and opposition representatives agreed on an open-source technical architecture for electronic ballots.',
      'Overseas Pakistanis in Gulf and North America will gain pilot i-voting portal access in by-elections.',
      'National Database and Registration Authority (NADRA) tasked with securing cryptographic biometric keys.',
    ],
    sourceName: 'Dawn',
    sourceUrl: 'https://www.dawn.com/news/1879004',
    category: 'Politics',
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80',
    publishedAt: '3h ago',
    scrapedAt: new Date().toISOString(),
    isBreaking: false,
    relatedSources: [
      {
        sourceName: 'The Express Tribune',
        sourceUrl: 'https://tribune.com.pk/story/249004/evm-consensus',
        headline: 'Cross-party consensus gives green light to digitized voting security blueprint',
        angleHighlight: 'Underlines audit trails and paper backup verifications.',
      },
      {
        sourceName: 'Geo News',
        sourceUrl: 'https://geo.tv/latest/parliament-evm-agreement',
        headline: 'Election Commission to commence pilot EVM trials in upcoming local government polls',
        angleHighlight: 'Quotes ECP officials on timeline of implementation.',
      },
    ],
  },
  {
    id: 'shanghai-cooperation-energy',
    title: 'Pakistan Signs Trilateral Clean Power Grid Memorandum at SCO Energy Forum',
    paragraphSummary:
      'A tripartite memorandum was ratified between energy authorities of Pakistan, Kazakhstan, and China at the Shanghai Cooperation Organization summit. The agreement establishes high-voltage direct current grid interconnectors aimed at transferring 2,000 megawatts of clean hydropower during high-demand summer peaks. Concessionary financing frameworks are being structured with multilateral development lenders to begin feasibility groundwork. Officials called the pact a vital step toward regional energy security and lower power costs.',
    highlightPhrases: ['2,000 megawatts', 'clean hydropower', 'high-voltage direct current', 'energy security'],
    summary: [
      'Tripartite accord between Pakistan, Kazakhstan, and China paves way for high-voltage DC interconnectors.',
      'Project targets routing 2,000 MW of regional hydropower to northern industrial zones in peak summer.',
      'Asian Development Bank indicates willingness to provide $450M concessionary anchor financing.',
    ],
    sourceName: 'The Express Tribune',
    sourceUrl: 'https://tribune.com.pk/story/249005/sco-power-grid',
    category: 'World',
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80',
    publishedAt: '4h ago',
    scrapedAt: new Date().toISOString(),
    isBreaking: false,
    relatedSources: [
      {
        sourceName: 'Dawn',
        sourceUrl: 'https://www.dawn.com/news/1879005',
        headline: 'Regional power sharing pact offers hope for lower energy tariffs in Pakistan',
        angleHighlight: 'Examines economic impacts on manufacturing electricity costs.',
      },
    ],
  },
  {
    id: 'coke-studio-season-16',
    title: 'Coke Studio Season 16 Announced With Groundbreaking Sufi-Electronic Collaborations',
    paragraphSummary:
      'The lineup for Coke Studio Season 16 was officially unveiled, highlighting an ambitious fusion of indigenous folk music and contemporary electronic synthesis. Curated by leading producers, the new season features traditional instrumentalists from Gilgit-Baltistan and Balochistan recording alongside diaspora audio engineers. All 12 studio recordings will be produced in spatial audio formats for worldwide listeners. Music critics celebrated the program for bridging regional heritage with cutting-edge production.',
    highlightPhrases: ['Coke Studio Season 16', 'Gilgit-Baltistan and Balochistan', 'spatial audio', 'indigenous folk'],
    summary: [
      'Producer Zulfiqar Jabbar Khan (Xulfi) unveiled a 12-track lineup featuring global diaspora producers.',
      'Season integrates folk instrumentalists from Gilgit-Baltistan and Balochistan with modular synthesizers.',
      'Soundtracks will be mastered in Dolby Atmos for streaming releases worldwide.',
    ],
    sourceName: 'Geo News',
    sourceUrl: 'https://geo.tv/entertainment/coke-studio-season-16-lineup',
    category: 'Entertainment',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    publishedAt: '5h ago',
    scrapedAt: new Date().toISOString(),
    isBreaking: false,
    relatedSources: [
      {
        sourceName: 'Dawn',
        sourceUrl: 'https://www.dawn.com/news/1879006',
        headline: 'Pakistani musical renaissance finds fresh voice as Coke Studio explores sonic frontiers',
        angleHighlight: 'Profiles featured traditional folk vocalists and cultural heritage preservation.',
      },
    ],
  },
];

export interface FetchArticlesParams {
  category?: string;
  pageSize?: number;
  lastDoc?: DocumentSnapshot | null;
  userInterests?: string[];
}

export interface FetchArticlesResult {
  articles: Article[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

// Seed Firestore articles if empty
export async function seedFirestoreArticlesIfEmpty(): Promise<void> {
  try {
    const articlesCol = collection(db, 'articles');
    const snapshot = await getDocs(query(articlesCol, limit(1)));

    if (snapshot.empty) {
      console.log('Seeding initial editorial articles to Firestore...');
      for (const article of REALISTIC_SEED_ARTICLES) {
        const articleRef = doc(db, 'articles', article.id);
        await setDoc(articleRef, {
          ...article,
          createdAt: serverTimestamp(),
        });
      }
      console.log('Firestore successfully seeded with articles!');
    }
  } catch (error) {
    console.warn('Could not seed Firestore (will use offline fallback):', error);
  }
}

// Fetch articles from Firestore with pagination and interest weighting
export async function fetchArticlesFromFirestore(
  params: FetchArticlesParams = {}
): Promise<FetchArticlesResult> {
  const { category = 'All', pageSize = 4, lastDoc = null, userInterests = [] } = params;

  try {
    const articlesCol = collection(db, 'articles');
    let q;

    if (category !== 'All') {
      if (lastDoc) {
        q = query(
          articlesCol,
          where('category', '==', category),
          orderBy('scrapedAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          articlesCol,
          where('category', '==', category),
          orderBy('scrapedAt', 'desc'),
          limit(pageSize)
        );
      }
    } else {
      if (lastDoc) {
        q = query(articlesCol, orderBy('scrapedAt', 'desc'), startAfter(lastDoc), limit(pageSize));
      } else {
        q = query(articlesCol, orderBy('scrapedAt', 'desc'), limit(pageSize));
      }
    }

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docs = querySnapshot.docs;
      const fetched: Article[] = docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title,
          summary: Array.isArray(data.summary) ? data.summary : [data.summary],
          paragraphSummary: data.paragraphSummary,
          highlightPhrases: Array.isArray(data.highlightPhrases) ? data.highlightPhrases : [],
          sourceName: data.sourceName || 'Dawn',
          sourceUrl: data.sourceUrl || 'https://www.dawn.com',
          category: data.category || 'General',
          imageUrl: data.imageUrl,
          publishedAt: data.publishedAt || 'Recently',
          scrapedAt: data.scrapedAt || new Date().toISOString(),
          isBreaking: !!data.isBreaking,
          relatedSources: data.relatedSources || [],
        };
      });

      // Sort by user interest priority if on 'All' category
      if (category === 'All' && userInterests.length > 0) {
        fetched.sort((a, b) => {
          const aMatch = userInterests.includes(a.category) ? 1 : 0;
          const bMatch = userInterests.includes(b.category) ? 1 : 0;
          return bMatch - aMatch;
        });
      }

      const nextLastDoc = docs[docs.length - 1];
      const hasMore = docs.length === pageSize;

      return {
        articles: fetched,
        lastDoc: nextLastDoc,
        hasMore,
      };
    }
  } catch (err) {
    console.warn('Firestore fetch query failed, serving realistic seed data:', err);
  }

  // Graceful fallback using local high quality seed articles
  let filtered = REALISTIC_SEED_ARTICLES;
  if (category !== 'All') {
    filtered = filtered.filter((a) => a.category === category);
  } else if (userInterests.length > 0) {
    // Priority sort by user interests
    filtered = [...filtered].sort((a, b) => {
      const aMatch = userInterests.includes(a.category) ? 1 : 0;
      const bMatch = userInterests.includes(b.category) ? 1 : 0;
      return bMatch - aMatch;
    });
  }

  return {
    articles: filtered,
    lastDoc: null,
    hasMore: false,
  };
}
