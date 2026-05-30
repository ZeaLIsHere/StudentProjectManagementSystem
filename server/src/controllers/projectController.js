import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ROLES, PROJECT_STATUS, NOTIFICATION_TYPE, INVITE_STATUS } from '../utils/constants.js';
import { sendPushNotification } from '../services/fcmService.js';

const getProjects = asyncHandler(async (req, res) => {
  const { userId, role } = req.user;
  let filter = {};

  switch (role) {
    case ROLES.ADMIN:
      break;
    case ROLES.DOSEN:
      filter = { owner: userId };
      break;
    case ROLES.ASISTEN_DOSEN:
      filter = { assistants: userId };
      break;
    case ROLES.MAHASISWA_KETUA:
      filter = { claimedBy: userId };
      break;
    case ROLES.MAHASISWA_ANGGOTA:
      filter = { members: userId };
      break;
    default:
      filter = { members: userId };
  }

  const projects = await Project.find(filter)
    .populate('owner', 'fullName email')
    .populate('claimedBy', 'fullName email')
    .populate('members', 'fullName email avatar role nim')
    .populate('assistants', 'fullName email')
    .sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: { projects },
  });
});

const getOpenProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ status: PROJECT_STATUS.OPEN })
    .populate('owner', 'fullName email')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { projects },
  });
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'fullName email avatar')
    .populate('claimedBy', 'fullName email avatar')
    .populate('members', 'fullName email avatar role nim')
    .populate('assistants', 'fullName email avatar');

  if (!project) {
    throw new ApiError(404, 'Proyek tidak ditemukan');
  }

  const { userId, role } = req.user;
  const isOwner = project.owner._id.toString() === userId;
  const isMember = project.members.some((m) => m._id.toString() === userId);
  const isClaimedBy = project.claimedBy?._id.toString() === userId;
  const isAssistant = project.assistants?.some((a) => a._id.toString() === userId);
  const isAdmin = role === ROLES.ADMIN;

  if (!isOwner && !isMember && !isClaimedBy && !isAssistant && !isAdmin) {
    if (project.status !== PROJECT_STATUS.OPEN || role !== ROLES.MAHASISWA_KETUA) {
      throw new ApiError(403, 'Anda tidak memiliki akses ke proyek ini');
    }
  }

  res.json({
    success: true,
    data: { project },
  });
});

const createProject = asyncHandler(async (req, res) => {
  const { title, description, maxMembers, startDate, endDate } = req.body;

  const project = await Project.create({
    title,
    description,
    owner: req.user.userId,
    maxMembers,
    startDate,
    endDate,
    status: PROJECT_STATUS.OPEN,
  });

  const populated = await Project.findById(project._id)
    .populate('owner', 'fullName email');

  res.status(201).json({
    success: true,
    message: 'Proyek berhasil dibuat',
    data: { project: populated },
  });
});

const claimProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new ApiError(404, 'Proyek tidak ditemukan');
  }

  if (project.status !== PROJECT_STATUS.OPEN) {
    throw new ApiError(400, 'Proyek sudah tidak tersedia atau telah ditutup');
  }

  // Cek apakah mahasiswa ketua ini sudah mengklaim topik proyek ini sebelumnya
  const existingClaim = await Project.findOne({
    title: project.title,
    owner: project.owner,
    claimedBy: req.user.userId,
    status: PROJECT_STATUS.ACTIVE,
  });

  if (existingClaim) {
    throw new ApiError(400, 'Anda sudah mengklaim topik proyek ini sebelumnya');
  }

  // Buat salinan (clone) proyek untuk kelompok ini
  const claimedProject = await Project.create({
    title: project.title,
    description: project.description,
    owner: project.owner,
    maxMembers: project.maxMembers,
    startDate: project.startDate,
    endDate: project.endDate,
    status: PROJECT_STATUS.ACTIVE,
    claimedBy: req.user.userId,
    claimedAt: new Date(),
    members: [req.user.userId],
    assistants: project.assistants || [],
  });

  const claimer = await User.findById(req.user.userId);

  await Notification.create({
    recipient: project.owner,
    sender: req.user.userId,
    type: NOTIFICATION_TYPE.PROJECT_CLAIMED,
    title: 'Proyek Diklaim',
    message: `${claimer.fullName} telah mengklaim proyek "${project.title}"`,
    relatedProject: claimedProject._id,
  });

  const owner = await User.findById(project.owner);
  if (owner?.fcmToken) {
    await sendPushNotification(
      owner.fcmToken,
      'Proyek Diklaim',
      `${claimer.fullName} telah mengklaim proyek "${project.title}"`
    );
  }

  const populated = await Project.findById(claimedProject._id)
    .populate('owner', 'fullName email')
    .populate('claimedBy', 'fullName email')
    .populate('members', 'fullName email avatar role nim');

  res.json({
    success: true,
    message: 'Proyek berhasil diklaim',
    data: { project: populated },
  });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new ApiError(404, 'Proyek tidak ditemukan');
  }

  const { userId, role } = req.user;
  const isOwner = project.owner.toString() === userId;
  const isAdmin = role === ROLES.ADMIN;

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'Anda tidak memiliki izin untuk mengubah proyek ini');
  }

  const { title, description, maxMembers, startDate, endDate, status } = req.body;

  if (title) project.title = title;
  if (description) project.description = description;
  if (maxMembers) project.maxMembers = maxMembers;
  if (startDate) project.startDate = startDate;
  if (endDate) project.endDate = endDate;
  if (status) project.status = status;

  await project.save();

  const populated = await Project.findById(project._id)
    .populate('owner', 'fullName email')
    .populate('claimedBy', 'fullName email')
    .populate('members', 'fullName email avatar role nim')
    .populate('assistants', 'fullName email avatar');

  res.json({
    success: true,
    message: 'Proyek berhasil diperbarui',
    data: { project: populated },
  });
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new ApiError(404, 'Proyek tidak ditemukan');
  }

  const { userId, role } = req.user;
  const isOwner = project.owner.toString() === userId;
  const isAdmin = role === ROLES.ADMIN;

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'Anda tidak memiliki izin untuk menghapus proyek ini');
  }

  await Project.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Proyek berhasil dihapus',
  });
});

const addMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new ApiError(404, 'Proyek tidak ditemukan');
  }

  const { userId, role } = req.user;
  const isClaimedBy = project.claimedBy?.toString() === userId;
  const isAdmin = role === ROLES.ADMIN;

  if (!isClaimedBy && !isAdmin) {
    throw new ApiError(403, 'Hanya ketua kelompok yang bisa menambah anggota');
  }

  if (project.members.length >= project.maxMembers) {
    throw new ApiError(400, `Jumlah anggota sudah mencapai batas maksimum (${project.maxMembers})`);
  }

  const { memberNim } = req.body;
  const newMember = await User.findOne({ nim: memberNim });

  if (!newMember) {
    throw new ApiError(404, 'Mahasiswa dengan NIM tersebut tidak ditemukan');
  }

  if (newMember.role !== ROLES.MAHASISWA_ANGGOTA) {
    throw new ApiError(400, 'Hanya mahasiswa-anggota yang bisa ditambahkan ke proyek');
  }

  if (project.members.includes(newMember._id)) {
    throw new ApiError(400, 'User sudah menjadi anggota proyek ini');
  }

  project.members.push(newMember._id);
  await project.save();

  await Notification.create({
    recipient: newMember._id,
    sender: req.user.userId,
    type: NOTIFICATION_TYPE.PROJECT_INVITE,
    title: 'Ditambahkan ke Proyek',
    message: `Anda telah ditambahkan ke proyek "${project.title}"`,
    relatedProject: project._id,
  });

  if (newMember.fcmToken) {
    await sendPushNotification(
      newMember.fcmToken,
      'Ditambahkan ke Proyek',
      `Anda telah ditambahkan ke proyek "${project.title}"`
    );
  }

  const populated = await Project.findById(project._id)
    .populate('owner', 'fullName email')
    .populate('claimedBy', 'fullName email')
    .populate('members', 'fullName email avatar role nim');

  res.json({
    success: true,
    message: 'Anggota berhasil ditambahkan',
    data: { project: populated },
  });
});

const removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new ApiError(404, 'Proyek tidak ditemukan');
  }

  const { userId, role } = req.user;
  const isClaimedBy = project.claimedBy?.toString() === userId;
  const isAdmin = role === ROLES.ADMIN;

  if (!isClaimedBy && !isAdmin) {
    throw new ApiError(403, 'Hanya ketua kelompok yang bisa menghapus anggota');
  }

  const memberToRemove = req.params.userId;

  if (memberToRemove === project.claimedBy?.toString()) {
    throw new ApiError(400, 'Tidak bisa menghapus ketua dari proyek');
  }

  project.members = project.members.filter(
    (m) => m.toString() !== memberToRemove
  );
  await project.save();

  const populated = await Project.findById(project._id)
    .populate('owner', 'fullName email')
    .populate('claimedBy', 'fullName email')
    .populate('members', 'fullName email avatar role nim');

  res.json({
    success: true,
    message: 'Anggota berhasil dihapus',
    data: { project: populated },
  });
});

const assignAssistant = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Proyek tidak ditemukan');

  const { userId } = req.user;
  if (project.owner.toString() !== userId) {
    throw new ApiError(403, 'Hanya pemilik proyek (Dosen) yang bisa menambah asisten');
  }

  const { assistantId } = req.body;
  const assistant = await User.findById(assistantId);
  if (!assistant || assistant.role !== ROLES.ASISTEN_DOSEN) {
    throw new ApiError(400, 'User bukan Asisten Dosen');
  }

  if (assistant.invitedBy?.toString() !== userId || assistant.inviteStatus !== INVITE_STATUS.ACCEPTED) {
    throw new ApiError(400, 'Asisten belum terhubung dengan Anda');
  }

  if (project.assistants.some(a => a.toString() === assistantId)) {
    throw new ApiError(400, 'Asisten sudah ditambahkan ke proyek ini');
  }

  project.assistants.push(assistantId);
  await project.save();

  const populated = await Project.findById(project._id)
    .populate('owner', 'fullName email')
    .populate('claimedBy', 'fullName email')
    .populate('members', 'fullName email avatar role nim')
    .populate('assistants', 'fullName email avatar');

  res.json({
    success: true,
    message: 'Asisten berhasil ditambahkan ke proyek',
    data: { project: populated },
  });
});

const removeAssistant = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Proyek tidak ditemukan');

  const { userId } = req.user;
  if (project.owner.toString() !== userId) {
    throw new ApiError(403, 'Hanya pemilik proyek (Dosen) yang bisa menghapus asisten');
  }

  project.assistants = project.assistants.filter(a => a.toString() !== req.params.assistantId);
  await project.save();

  const populated = await Project.findById(project._id)
    .populate('owner', 'fullName email')
    .populate('claimedBy', 'fullName email')
    .populate('members', 'fullName email avatar role nim')
    .populate('assistants', 'fullName email avatar');

  res.json({
    success: true,
    message: 'Asisten berhasil dihapus dari proyek',
    data: { project: populated },
  });
});

const getMyAssistants = asyncHandler(async (req, res) => {
  const assistants = await User.find({
    role: ROLES.ASISTEN_DOSEN,
    invitedBy: req.user.userId,
    inviteStatus: INVITE_STATUS.ACCEPTED,
  }).select('fullName email avatar');

  res.json({ success: true, data: { assistants } });
});

export {
  getProjects,
  getOpenProjects,
  getProjectById,
  createProject,
  claimProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  assignAssistant,
  removeAssistant,
  getMyAssistants,
};
