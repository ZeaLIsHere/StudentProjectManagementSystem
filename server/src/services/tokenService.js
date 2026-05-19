import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import RefreshToken from '../models/RefreshToken.js';

const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

const generateRefreshToken = async (userId) => {
  const token = crypto.randomBytes(40).toString('hex');

  const expiresAt = new Date();
  const daysMatch = (process.env.JWT_REFRESH_EXPIRY || '7d').match(/(\d+)d/);
  const days = daysMatch ? parseInt(daysMatch[1]) : 7;
  expiresAt.setDate(expiresAt.getDate() + days);

  await RefreshToken.create({
    token,
    user: userId,
    expiresAt,
  });

  return token;
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

const verifyRefreshToken = async (token) => {
  const storedToken = await RefreshToken.findOne({ token }).populate('user');
  if (!storedToken) return null;
  if (storedToken.expiresAt < new Date()) {
    await RefreshToken.deleteOne({ _id: storedToken._id });
    return null;
  }
  return storedToken;
};

const rotateRefreshToken = async (oldToken, userId) => {
  await RefreshToken.deleteOne({ token: oldToken });
  return generateRefreshToken(userId);
};

const revokeAllUserTokens = async (userId) => {
  await RefreshToken.deleteMany({ user: userId });
};

export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  rotateRefreshToken,
  revokeAllUserTokens,
};
