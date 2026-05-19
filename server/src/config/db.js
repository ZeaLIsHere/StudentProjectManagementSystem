import mongoose from 'mongoose';

const FALLBACK_URI = 'mongodb://localhost:27017/spms';
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const primaryUri = process.env.MONGODB_URI;
  if (!primaryUri) {
    console.error('MONGODB_URI is not defined in environment variables.');
    return;
  }

  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Primary DB failed (${error.message})`);

    // Only fallback in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Attempting local MongoDB fallback...');
      try {
        const conn = await mongoose.connect(FALLBACK_URI, {
          serverSelectionTimeoutMS: 3000,
        });
        isConnected = true;
        console.log(`MongoDB Connected (fallback): ${conn.connection.host}`);
      } catch (fallbackError) {
        console.error(`MongoDB Fallback Error: ${fallbackError.message}`);
      }
    } else {
      console.error(`MongoDB Connection Error: ${error.message}`);
      // In serverless, do NOT call process.exit(1) to avoid breaking the container
      throw error;
    }
  }
};

export default connectDB;
