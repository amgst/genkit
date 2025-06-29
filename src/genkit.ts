import { configureGenkit } from '@genkit-ai/core';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import { defineFlow } from '@genkit-ai/flow';
import { generate } from '@genkit-ai/ai';
import { z } from 'zod';
import { VectorStore } from './vectorStore';

configureGenkit({
  plugins: [googleAI()]
});

export const askVanceFlow = defineFlow(
  {
    name: 'askVance',
    inputSchema: z.object({
      question: z.string()
    }),
    outputSchema: z.object({
      answer: z.string(),
      sources: z.array(z.string())
    })
  },
  async (input) => {
    try {
      console.log('Processing question:', input.question);
      
      const vectorStore = new VectorStore();
      await vectorStore.initialize();
      
      const searchResults = await vectorStore.search(input.question, 3);
      console.log('Found results:', searchResults.length);
      
      if (searchResults.length === 0) {
        return {
          answer: "I couldn't find relevant information. Please contact VanceGraphix directly.",
          sources: []
        };
      }
      
      const context = searchResults.map(r => r.content).join('\n\n');
      const sources = [...new Set(searchResults.map(r => r.metadata.url))];
      
      const response = await generate({
        model: gemini15Flash,
        prompt: `Based on this VanceGraphix content: ${context}\n\nAnswer: ${input.question}`
      });
      
      return {
        answer: response.text(),
        sources: sources
      };
    } catch (error) {
      console.error('Flow error:', error);
      return {
        answer: "Sorry, I'm having technical difficulties. Please try again.",
        sources: []
      };
    }
  }
);