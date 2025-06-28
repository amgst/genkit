import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedContent } from './types';

export class VanceGraphixScraper {
  private baseUrl = 'https://vancegraphix.com.au';
  private visitedUrls = new Set<string>();

  async scrapeWebsite(): Promise<ScrapedContent[]> {
    const startUrls = [
      this.baseUrl,
      `${this.baseUrl}/about`,
      `${this.baseUrl}/services`,
      `${this.baseUrl}/portfolio`,
      `${this.baseUrl}/contact`,
      `${this.baseUrl}/pricing`,
      `${this.baseUrl}/faq`
    ];

    const scrapedContent: ScrapedContent[] = [];

    for (const url of startUrls) {
      try {
        const content = await this.scrapePage(url);
        if (content) {
          scrapedContent.push(content);
        }
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
      }
    }

    return scrapedContent;
  }

  private async scrapePage(url: string): Promise<ScrapedContent | null> {
    if (this.visitedUrls.has(url)) return null;
    this.visitedUrls.add(url);

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VanceGraphix-Bot/1.0)'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Remove script and style elements
      $('script, style, nav, footer, .cookie-banner').remove();
      
      const title = $('title').text().trim() || $('h1').first().text().trim();
      
      // Extract main content
      const contentSelectors = [
        'main',
        '.content',
        '.main-content',
        'article',
        '.page-content',
        'body'
      ];
      
      let content = '';
      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length) {
          content = element.text();
          break;
        }
      }
      
      // Clean and normalize content
      content = this.cleanContent(content);
      
      if (content.length < 100) return null; // Skip pages with minimal content
      
      const chunks = this.chunkContent(content);
      
      return {
        url,
        title,
        content,
        chunks
      };
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error);
      return null;
    }
  }

  private cleanContent(content: string): string {
    return content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  private chunkContent(content: string, maxChunkSize = 1000): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}