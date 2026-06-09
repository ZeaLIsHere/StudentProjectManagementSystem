import Project from '../models/Project.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ROLES } from '../utils/constants.js';
import { assertProjectAccess } from '../utils/projectAccess.js';
import { getProjectHeatmap, getUserHeatmap } from '../services/heatmapService.js';

const getProjectHeatmapData = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) {
    throw new ApiError(404, 'Proyek tidak ditemukan');
  }

  assertProjectAccess(project, req.user.userId, req.user.role, { allowOpenForKetua: true });

  const data = await getProjectHeatmap(req.params.projectId);
  res.json({ success: true, data: { heatmap: data } });
});

const getUserHeatmapData = asyncHandler(async (req, res) => {
  const { userId, role } = req.user;
  const targetUserId = req.params.userId;

  if (targetUserId !== userId && role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Anda tidak memiliki akses ke data heatmap ini');
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    throw new ApiError(404, 'User tidak ditemukan');
  }

  const data = await getUserHeatmap(targetUserId);
  res.json({ success: true, data: { heatmap: data } });
});

export { getProjectHeatmapData, getUserHeatmapData };
