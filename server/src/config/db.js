import mongoose from 'mongoose';

const FALLBACK_URI = 'mongodb://localhost:27017/spms';

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI;

  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Primary DB failed (${error.message})`);

    // If primary is Atlas and it failed, try local fallback in development
    if (primaryUri.includes('mongodb+srv') && process.env.NODE_ENV !== 'production') {
      console.log('Attempting local MongoDB fallback...');
      try {
        const conn = await mongoose.connect(FALLBACK_URI, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`MongoDB Connected (fallback): ${conn.connection.host}`);
      } catch (fallbackError) {
        console.error(`MongoDB Fallback Error: ${fallbackError.message}`);
        process.exit(1);
      }
    } else {
      console.error(`MongoDB Connection Error: ${error.message}`);
      process.exit(1);
    }
  }
};

export default connectDB;
