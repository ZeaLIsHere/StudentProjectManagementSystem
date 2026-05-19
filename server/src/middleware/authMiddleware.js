import { verifyAccessToken } from '../services/tokenService.js';
import ApiError from '../utils/ApiError.js';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Token tidak ditemukan');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired', [{ code: 'TOKEN_EXPIRED' }]);
    }
    throw new ApiError(401, 'Token tidak valid');
  }
};

export default authMiddleware;
