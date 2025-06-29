import { VectorDocument, ScrapedContent } from './types';

export class VectorStore {
  private documents: VectorDocument[] = [];

  async initialize() {
    console.log('In-memory vector store initialized');
  }

  async addDocuments(scrapedContent: ScrapedContent[]) {
    const documents: VectorDocument[] = [];
    
    for (const content of scrapedContent) {
      content.chunks.forEach((chunk, index) => {
        documents.push({
          id: `${content.url}-chunk-${index}`,
          content: chunk,
          metadata: {
            url: content.url,
            title: content.title,
            chunkIndex: index
          }
        });
      });
    }

    this.documents = documents;
    console.log(`Added ${documents.length} document chunks to vector store`);
  }

  async search(query: string, limit = 5) {
    try {
      // Simple keyword matching
      const queryWords = query.toLowerCase().split(' ');
      
      const results = this.documents
        .map(doc => {
          const content = doc.content.toLowerCase();
          const score = queryWords.reduce((acc, word) => {
            return acc + (content.includes(word) ? 1 : 0);
          }, 0);
          
          return {
            content: doc.content,
            metadata: doc.metadata,
            distance: 1 - (score / queryWords.length)
          };
        })
        .filter(result => result.distance < 1)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);
      
      return results;
    } catch (error) {
      console.error('Error searching vector store:', error);
      return [];
    }
  }
}