// Express API server for SWAG Concept Sketch Agent

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import generateRouter from './routes/generate.js';
import stylesRouter from './routes/styles.js';
import feedbackRouter from './routes/feedback.js';
import generationsRouter from './routes/generations.js';
import { checkPythonHealth } from './services/python-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ApiServerOptions {
  port?: number;
  generatedImagesPath?: string;
  referenceImagesPath?: string;
  frontendPath?: string;
}

export function createApp(options: ApiServerOptions = {}) {
  const generatedPath = options.generatedImagesPath || path.resolve(__dirname, '../../../generated_outputs');
  const referencePath = options.referenceImagesPath || path.resolve(__dirname, '../../../rag/reference_images');

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Serve generated images
  app.use('/api/generated', express.static(generatedPath));

  // Serve reference images
  app.use('/api/reference-images', express.static(referencePath));

  // Request logging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });

  // Health check with Python backend status
  app.get('/api/health', async (req, res) => {
    const pythonConnected = await checkPythonHealth();
    res.json({
      status: 'ok',
      pythonBackend: pythonConnected ? 'connected' : 'disconnected',
      version: '1.0.0',
      mode: pythonConnected ? 'production' : 'mock'
    });
  });

  // Mount routes
  app.use('/api', generateRouter);
  app.use('/api', stylesRouter);
  app.use('/api', feedbackRouter);
  app.use('/api', generationsRouter);

  // Serve frontend static files (used by Electron in production)
  if (options.frontendPath) {
    app.use(express.static(options.frontendPath));
    // SPA catch-all: serve index.html for non-API routes
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(options.frontendPath!, 'index.html'));
    });
  }

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.path} not found`
      }
    });
  });

  // Error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  });

  return app;
}

/**
 * Start the API server. Used by Electron main process to embed the server.
 */
export function startApiServer(options: ApiServerOptions = {}): Promise<import('http').Server> {
  const port = options.port || 3001;
  const app = createApp(options);

  return new Promise((resolve) => {
    const server = app.listen(port, async () => {
      const pythonConnected = await checkPythonHealth();
      console.log(`[API] Server running on http://localhost:${port}`);
      console.log(`[API] Python backend: ${pythonConnected ? 'CONNECTED' : 'DISCONNECTED (using mock)'}`);
      resolve(server);
    });
  });
}

// Auto-start when run directly (e.g., npm run dev in control/api/)
const isDirectRun = import.meta.url === `file://${process.argv[1]}` ||
                    process.argv[1]?.endsWith('server.ts') ||
                    process.argv[1]?.endsWith('server.js');

if (isDirectRun) {
  const PORT = 3001;
  startApiServer({ port: PORT }).then(() => {
    console.log('='.repeat(60));
    console.log('SWAG Concept Sketch Agent - API Server');
    console.log('='.repeat(60));
    console.log(`Available endpoints:`);
    console.log(`  GET  http://localhost:${PORT}/api/health`);
    console.log(`  GET  http://localhost:${PORT}/api/styles`);
    console.log(`  POST http://localhost:${PORT}/api/generate`);
    console.log(`  GET  http://localhost:${PORT}/api/generated/* (static images)`);
    console.log('='.repeat(60));
  });
}
