// Express API server for SWAG Concept Sketch Agent

import express from 'express';
import cors from 'cors';
import generateRouter from './routes/generate.js';
import stylesRouter from './routes/styles.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    pythonBackend: 'disconnected', // Will be 'connected' when Python integration is added
    version: '1.0.0',
    mode: 'mock'
  });
});

// Mount routes
app.use('/api', generateRouter);
app.use('/api', stylesRouter);

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
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('SWAG Concept Sketch Agent - API Server');
  console.log('='.repeat(60));
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Mode: MOCK (Python backend not integrated)`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${PORT}/api/health`);
  console.log(`  GET  http://localhost:${PORT}/api/styles`);
  console.log(`  POST http://localhost:${PORT}/api/generate`);
  console.log('='.repeat(60));
});
