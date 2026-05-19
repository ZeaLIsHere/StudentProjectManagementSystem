import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ROLES } from '../utils/constants.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  rotateRefreshToken,
  revokeAllUserTokens,
} from '../services/tokenService.js';

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role, nim, nidn } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email sudah terdaftar');
  }

  const allowedRoles = [ROLES.DOSEN, ROLES.ASISTEN_DOSEN, ROLES.MAHASISWA_KETUA, ROLES.MAHASISWA_ANGGOTA];
  if (!allowedRoles.includes(role)) {
    throw new ApiError(400, 'Role tidak valid');
  }

  // Validate NIM for mahasiswa roles
  if (role === ROLES.MAHASISWA_KETUA || role === ROLES.MAHASISWA_ANGGOTA) {
    if (!nim || !nim.trim()) {
      throw new ApiError(400, 'NIM wajib diisi untuk mahasiswa');
    }
    const existingNim = await User.findOne({ nim: nim.trim() });
    if (existingNim) {
      throw new ApiError(409, 'NIM sudah terdaftar');
    }
  }

  // Validate NIDN for dosen role
  if (role === ROLES.DOSEN) {
    if (!nidn || !nidn.trim()) {
      throw new ApiError(400, 'NIDN wajib diisi untuk dosen');
    }
    const existingNidn = await User.findOne({ nidn: nidn.trim() });
    if (existingNidn) {
      throw new ApiError(409, 'NIDN sudah terdaftar');
    }
  }

  const userData = { fullName, email, password, role };
  if (nim) userData.nim = nim.trim();
  if (nidn) userData.nidn = nidn.trim();

  const user = await User.create(userData);

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = await generateRefreshToken(user._id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    success: true,
    message: 'Registrasi berhasil',
    data: {
      user: user.toJSON(),
      accessToken,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Email atau password salah');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Akun Anda telah dinonaktifkan');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Email atau password salah');
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = await generateRefreshToken(user._id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    message: 'Login berhasil',
    data: {
      user: user.toJSON(),
      accessToken,
    },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken: oldToken } = req.cookies;

  if (!oldToken) {
    throw new ApiError(401, 'Refresh token tidak ditemukan');
  }

  const storedToken = await verifyRefreshToken(oldToken);
  if (!storedToken) {
    throw new ApiError(401, 'Refresh token tidak valid atau sudah expired');
  }

  const user = storedToken.user;
  if (!user.isActive) {
    throw new ApiError(403, 'Akun Anda telah dinonaktifkan');
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = await rotateRefreshToken(oldToken, user._id);

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    data: {
      user: user.toJSON(),
      accessToken,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    await revokeAllUserTokens(req.user.userId);
  }

  res.clearCookie('refreshToken');

  res.json({
    success: true,
    message: 'Logout berhasil',
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) {
    throw new ApiError(404, 'User tidak ditemukan');
  }

  res.json({
    success: true,
    data: { user },
  });
});

export { register, login, refresh, logout, getMe };
