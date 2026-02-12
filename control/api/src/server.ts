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

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve generated images from Python's output directory
// Path: /api/generated/* -> ../../../generated_outputs/*
const generatedImagesPath = path.resolve(__dirname, '../../../generated_outputs');
app.use('/api/generated', express.static(generatedImagesPath));

// Serve reference images from rag/reference_images/
const referenceImagesPath = path.resolve(__dirname, '../../../rag/reference_images');
app.use('/api/reference-images', express.static(referenceImagesPath));

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

// Start server
app.listen(PORT, async () => {
  const pythonConnected = await checkPythonHealth();
  console.log('='.repeat(60));
  console.log('SWAG Concept Sketch Agent - API Server');
  console.log('='.repeat(60));
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Python backend: ${pythonConnected ? 'CONNECTED (http://localhost:8000)' : 'DISCONNECTED (using mock)'}`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${PORT}/api/health`);
  console.log(`  GET  http://localhost:${PORT}/api/styles`);
  console.log(`  POST http://localhost:${PORT}/api/generate`);
  console.log(`  GET  http://localhost:${PORT}/api/generated/* (static images)`);
  console.log('='.repeat(60));
});
