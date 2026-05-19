import Task from '../models/Task.js';
import Project from '../models/Project.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ROLES } from '../utils/constants.js';

const bulkUpdateTasks = asyncHandler(async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new ApiError(400, 'Data update tidak valid');
  }

  const firstTask = await Task.findById(updates[0].taskId);
  if (!firstTask) {
    throw new ApiError(404, 'Task tidak ditemukan');
  }

  const project = await Project.findById(firstTask.project);
  if (!project) {
    throw new ApiError(404, 'Proyek tidak ditemukan');
  }

  const { userId, role } = req.user;
  const isMember = project.members.some((m) => m.toString() === userId);
  const isOwner = project.owner.toString() === userId;
  const isAdmin = role === ROLES.ADMIN;

  if (!isMember && !isOwner && !isAdmin) {
    throw new ApiError(403, 'Anda tidak memiliki akses ke proyek ini');
  }

  const results = await Promise.all(
    updates.map(async (update) => {
      const { taskId, status, position } = update;
      const task = await Task.findById(taskId);
      if (!task) return null;

      const project = await Project.findById(task.project);
      const isKetua = project?.claimedBy?.toString() === userId;
      const isAssigneeKetua = task.assignee?.toString() === project?.claimedBy?.toString();

      const updateData = {};

      if (status !== undefined) {
        // Enforce that regular members cannot drag any task directly to done
        if (status === 'done' && !isKetua && !isAdmin) {
          throw new ApiError(403, 'Hanya ketua kelompok yang dapat menyetujui atau menyelesaikan task');
        }

        updateData.status = status;

        if (status === 'done') {
          updateData.completedAt = new Date();
          if (isAssigneeKetua || isKetua) {
            updateData.approvalStatus = 'approved';
          }
        } else {
          updateData.completedAt = null;
          if (status === 'todo' || status === 'in_progress') {
            // Reset approval if moved back
            updateData.approvalStatus = null;
            updateData.revisionComment = '';
          }
        }
      }

      if (position !== undefined) {
        updateData.position = position;
      }

      return Task.findByIdAndUpdate(taskId, updateData, { new: true })
        .populate('assignee', 'fullName email avatar')
        .populate('reporter', 'fullName email avatar')
        .populate('reviewedBy', 'fullName email')
        .populate('attachments.uploadedBy', 'fullName email')
        .populate('comments.author', 'fullName email avatar');
    })
  );

  res.json({
    success: true,
    message: `${results.length} task berhasil diperbarui`,
    data: { tasks: results.filter(Boolean) },
  });
});

export { bulkUpdateTasks };
