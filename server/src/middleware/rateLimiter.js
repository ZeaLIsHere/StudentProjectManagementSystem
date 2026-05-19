import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 100,
  message: {
    success: false,
    message: 'Terlalu banyak request, coba lagi setelah 15 menit',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 20,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login, coba lagi setelah 15 menit',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export { apiLimiter, authLimiter };
