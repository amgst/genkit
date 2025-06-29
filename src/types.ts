export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  chunks: string[];
}

export interface VectorDocument {
  id: string;
  content: string;
  metadata: {
    url: string;
    title: string;
    chunkIndex: number;
  };
}