// src/index.ts
import dotenv from 'dotenv';
import { VanceGraphixScraper } from './scraper';
import { VectorStore } from './vectorStore';
import { ChatbotServer } from './server';

dotenv.config();

async function main() {
  try {
    console.log('Starting VanceGraphix Chatbot setup...');
    
    // Initialize vector store
    const vectorStore = new VectorStore();
    await vectorStore.initialize();
    
    // Check if we need to scrape and populate data
    const shouldScrape = process.argv.includes('--scrape');
    
    if (shouldScrape) {
      console.log('Scraping VanceGraphix website...');
      const scraper = new VanceGraphixScraper();
      const scrapedContent = await scraper.scrapeWebsite();
      
      console.log(`Scraped ${scrapedContent.length} pages`);
      
      if (scrapedContent.length > 0) {
        await vectorStore.addDocuments(scrapedContent);
        console.log('Content added to vector store');
      }
    }
    
    // Start server
    const server = new ChatbotServer();
    server.start();
    
  } catch (error) {
    console.error('Error starting application:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
