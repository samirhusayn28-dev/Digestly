import 'dotenv/config';
import { runScrapingPipeline } from '../scrapers/index.js';

async function main() {
  console.log('==============================================');
  console.log('   DIGESTLY NEWS SCRAPER & SUMMARIZER TEST    ');
  console.log('==============================================');
  console.log(`Checking NEWS-API-KEY: ${process.env['NEWS-API-KEY'] ? 'Configured ✅' : 'Not set (using intelligent fallback)'}`);

  const start = Date.now();
  const result = await runScrapingPipeline();
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);

  console.log('\n================ Pipeline Results ================');
  console.log(`Elapsed Time:    ${elapsed}s`);
  console.log(`Raw Scraped:     ${result.scrapedCount} articles`);
  console.log(`Summarized:      ${result.processedCount} articles`);
  console.log(`Saved:           ${result.savedCount} articles`);

  console.log('\n--- Sample Processed Article ---');
  if (result.articles.length > 0) {
    const sample = result.articles[0];
    console.log(`ID:       ${sample.id}`);
    console.log(`Source:   ${sample.sourceName}`);
    console.log(`Category: ${sample.category}`);
    console.log(`Title:    ${sample.title}`);
    console.log('Summary:');
    sample.summary.forEach((line, i) => console.log(`  ${i + 1}. ${line}`));
    if (sample.relatedSources && sample.relatedSources.length > 0) {
      console.log(`Multi-Source Coverage: ${sample.relatedSources.length} comparative sources found`);
      sample.relatedSources.forEach((r) => console.log(`  - [${r.sourceName}] ${r.headline}`));
    }
  }
  console.log('==============================================\n');
}

main().catch(console.error);
