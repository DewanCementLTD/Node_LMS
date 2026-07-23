// 1. Load environment variables FIRST before anything else
import 'dotenv/config'; 

import app from './app.js';
import { getDirectConnection } from './config/database.js';

import { logger } from './utils/logger.js';
const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // 2. Initialize the Database 

    await getDirectConnection();
    logger.info('Direct database connection established successfully.');

    // 3. Start the Express Server listening for HTTP requests
    app.listen(PORT, () => {
      logger.info(`ERP Server is running in ESM mode on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('CRITICAL: Server failed to start.', error);
    process.exit(1);
  }
};

startServer();

