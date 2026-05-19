import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import { initFirebase } from './src/config/firebase.js';
import { startDeadlineScheduler } from './src/services/deadlineScheduler.js';

const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}

const startServer = async () => {
  await connectDB();
  initFirebase();
  startDeadlineScheduler();

  app.listen(PORT, () => {
    console.log(`SPMS Server running on port ${PORT}`);
  });
};

startServer();
