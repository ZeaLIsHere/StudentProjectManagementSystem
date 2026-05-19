import User from '../models/User.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ROLES, INVITE_STATUS, NOTIFICATION_TYPE } from '../utils/constants.js';

const getUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { nim: { $regex: search, $options: 'i' } },
    ];
  }
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: { users } });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User tidak ditemukan');
  res.json({ success: true, data: { user } });
});

const updateUser = asyncHandler(async (req, res) => {
  const { fullName, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.userId,
    { fullName, avatar },
    { new: true, runValidators: true }
  );
  if (!user) throw new ApiError(404, 'User tidak ditemukan');
  res.json({ success: true, data: { user } });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, email, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.userId).select('+password');
  if (!user) throw new ApiError(404, 'User tidak ditemukan');

  if (fullName) user.fullName = fullName;

  if (email && email !== user.email) {
    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(409, 'Email sudah digunakan');
    user.email = email;
  }

  if (newPassword) {
    if (!currentPassword) throw new ApiError(400, 'Password lama wajib diisi');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new ApiError(401, 'Password lama salah');
    user.password = newPassword;
  }

  await user.save();
  res.json({ success: true, message: 'Profil berhasil diperbarui', data: { user: user.toJSON() } });
});

const inviteAssistant = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const dosen = await User.findById(req.user.userId);
  if (!dosen || dosen.role !== ROLES.DOSEN) {
    throw new ApiError(403, 'Hanya dosen yang dapat mengundang asisten');
  }

  const assistant = await User.findOne({ email });
  if (!assistant) throw new ApiError(404, 'User dengan email tersebut tidak ditemukan');
  if (assistant.role !== ROLES.ASISTEN_DOSEN) {
    throw new ApiError(400, 'User bukan Asisten Dosen');
  }

  if (assistant.invitedBy && assistant.inviteStatus === INVITE_STATUS.ACCEPTED) {
    throw new ApiError(400, 'Asisten sudah terhubung dengan dosen lain');
  }

  assistant.invitedBy = dosen._id;
  assistant.inviteStatus = INVITE_STATUS.PENDING;
  await assistant.save();

  await Notification.create({
    recipient: assistant._id,
    sender: dosen._id,
    type: NOTIFICATION_TYPE.ASISTEN_INVITE,
    title: 'Undangan Asisten Dosen',
    message: `${dosen.fullName} mengundang Anda sebagai Asisten Dosen`,
  });

  res.json({ success: true, message: 'Undangan berhasil dikirim' });
});

const acceptInvite = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user || user.role !== ROLES.ASISTEN_DOSEN) {
    throw new ApiError(403, 'Hanya asisten dosen yang dapat menerima undangan');
  }

  if (!user.invitedBy || user.inviteStatus !== INVITE_STATUS.PENDING) {
    throw new ApiError(400, 'Tidak ada undangan pending');
  }

  user.inviteStatus = INVITE_STATUS.ACCEPTED;
  await user.save();

  await Notification.create({
    recipient: user.invitedBy,
    sender: user._id,
    type: NOTIFICATION_TYPE.ASISTEN_INVITE,
    title: 'Undangan Diterima',
    message: `${user.fullName} menerima undangan sebagai Asisten Dosen`,
  });

  res.json({ success: true, message: 'Undangan berhasil diterima' });
});

const rejectInvite = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user || user.role !== ROLES.ASISTEN_DOSEN) {
    throw new ApiError(403, 'Hanya asisten dosen yang dapat menolak undangan');
  }

  if (!user.invitedBy || user.inviteStatus !== INVITE_STATUS.PENDING) {
    throw new ApiError(400, 'Tidak ada undangan pending');
  }

  user.invitedBy = null;
  user.inviteStatus = null;
  await user.save();

  res.json({ success: true, message: 'Undangan ditolak' });
});

const getPendingInvites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).populate('invitedBy', 'fullName email');
  if (!user) throw new ApiError(404, 'User tidak ditemukan');

  const invite = (user.inviteStatus === INVITE_STATUS.PENDING && user.invitedBy) 
    ? { from: user.invitedBy, status: user.inviteStatus } 
    : null;

  res.json({ success: true, data: { invite } });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!Object.values(ROLES).includes(role)) throw new ApiError(400, 'Role tidak valid');
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) throw new ApiError(404, 'User tidak ditemukan');
  res.json({ success: true, message: 'Role berhasil diperbarui', data: { user } });
});

const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User tidak ditemukan');
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, message: `User berhasil ${user.isActive ? 'diaktifkan' : 'dinonaktifkan'}`, data: { user } });
});

const promoteToKetua = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User tidak ditemukan');
  if (user.role !== ROLES.MAHASISWA_ANGGOTA) throw new ApiError(400, 'Hanya mahasiswa-anggota yang bisa dipromosikan');
  user.role = ROLES.MAHASISWA_KETUA;
  await user.save();
  res.json({ success: true, message: 'User berhasil dipromosikan menjadi ketua', data: { user } });
});

export { getUsers, getUserById, updateUser, updateProfile, updateUserRole, toggleUserActive, promoteToKetua, inviteAssistant, acceptInvite, rejectInvite, getPendingInvites };
