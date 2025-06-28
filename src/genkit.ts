import { genkit } from '@genkit-ai/core';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import { defineFlow } from '@genkit-ai/flow';
import { VectorStore } from './vectorStore';

const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash
});

export const askVanceFlow = defineFlow(
  {
    name: 'askVance',
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string' }
      },
      required: ['question']
    },
    outputSchema: {
      type: 'object',
      properties: {
        answer: { type: 'string' },
        sources: { 
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  async (input) => {
    const vectorStore = new VectorStore();
    await vectorStore.initialize();
    
    // Search for relevant content
    const searchResults = await vectorStore.search(input.question, 5);
    
    if (searchResults.length === 0) {
      return {
        answer: "I couldn't find relevant information about that topic on the VanceGraphix website. Please try rephrasing your question or contact VanceGraphix directly for assistance.",
        sources: []
      };
    }
    
    // Prepare context from search results
    const context = searchResults
      .map(result => result.content)
      .join('\n\n');
    
    const sources = [...new Set(searchResults.map(r => r.metadata.url))];
    
    // Generate response using Gemini
    const prompt = `You are a helpful assistant for VanceGraphix, a graphic design and web development company. Answer the user's question based ONLY on the provided context from the VanceGraphix website. If the context doesn't contain enough information to answer the question, say so politely and suggest contacting VanceGraphix directly.

Context from VanceGraphix website:
${context}

User Question: ${input.question}

Instructions:
- Only use information from the provided context
- Be helpful and professional
- If you can't answer based on the context, be honest about it
- Keep responses concise but informative
- Maintain VanceGraphix's professional tone

Answer:`;

    const response = await ai.generate({
      model: gemini15Flash,
      prompt: prompt
    });
    
    return {
      answer: response.text(),
      sources: sources
    };
  }
);