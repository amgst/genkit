import express from 'express';
import cors from 'cors';
import path from 'path';
import { askVanceFlow } from './genkit';

export class ChatbotServer {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Chat endpoint
    this.app.post('/api/chat', async (req, res) => {
      try {
        const { question } = req.body;
        
        if (!question || typeof question !== 'string') {
          return res.status(400).json({ 
            error: 'Question is required and must be a string' 
          });
        }

        const result = await askVanceFlow({ question });
        
        res.json({
          answer: result.answer,
          sources: result.sources,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ 
          error: 'An error occurred while processing your question' 
        });
      }
    });

    // Serve frontend
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`VanceGraphix Chatbot server running on port ${this.port}`);
    });
  }
}

