import { ChromaApi, OpenAIEmbeddingFunction } from 'chromadb';
import { VectorDocument, ScrapedContent } from './types';

export class VectorStore {
  private client: ChromaApi;
  private collection: any;
  private embeddingFunction: OpenAIEmbeddingFunction;

  constructor() {
    this.client = new ChromaApi({
      host: 'localhost',
      port: 8000
    });
    
    this.embeddingFunction = new OpenAIEmbeddingFunction({
      openai_api_key: process.env.OPENAI_API_KEY || ''
    });
  }

  async initialize() {
    try {
      this.collection = await this.client.getOrCreateCollection({
        name: 'vancegraphix_content',
        embeddingFunction: this.embeddingFunction
      });
      console.log('Vector store initialized');
    } catch (error) {
      console.error('Error initializing vector store:', error);
      throw error;
    }
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

    try {
      await this.collection.add({
        ids: documents.map(d => d.id),
        documents: documents.map(d => d.content),
        metadatas: documents.map(d => d.metadata)
      });
      
      console.log(`Added ${documents.length} document chunks to vector store`);
    } catch (error) {
      console.error('Error adding documents to vector store:', error);
      throw error;
    }
  }

  async search(query: string, limit = 5) {
    try {
      const results = await this.collection.query({
        queryTexts: [query],
        nResults: limit
      });
      
      return results.documents[0].map((doc: string, index: number) => ({
        content: doc,
        metadata: results.metadatas[0][index],
        distance: results.distances[0][index]
      }));
    } catch (error) {
      console.error('Error searching vector store:', error);
      return [];
    }
  }
}