import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';

import { logger } from './utils/logger.js';
const app = express();

// 1. Security & Parsing Middleware
app.use(cors()); // Allow frontend to talk to this API
app.use(express.json()); // Parse JSON body payloads


// 2. Mount all routes
app.use('/', routes);

// 3. Global Error Handler (Catches all `next(error)` calls)
app.use((err, req, res, next) => {
  logger.error(err, 'Unhandled Error');
  res.status(500).json({ 
    detail: err.message || "Internal Server Error" 
  });
});

export default app;