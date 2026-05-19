import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import corsOptions from './config/cors.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import kanbanRoutes from './routes/kanbanRoutes.js';
import heatmapRoutes from './routes/heatmapRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userRoutes from './routes/userRoutes.js';

import connectDB from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy is required for express-rate-limit to work correctly behind Vercel proxy
app.set('trust proxy', 1);

// Database connection middleware for serverless
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api', apiLimiter);

// Serve uploaded files
const uploadsPath = process.env.NODE_ENV === 'production'
  ? '/tmp/uploads'
  : path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SPMS API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes);
app.use('/api/kanban', kanbanRoutes);
app.use('/api/heatmap', heatmapRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

app.use(errorHandler);

export default app;
