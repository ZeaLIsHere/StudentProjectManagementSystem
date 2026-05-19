import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ROLES, TASK_STATUS, TASK_PRIORITY, APPROVAL_STATUS, NOTIFICATION_TYPE } from '../utils/constants.js';
import { sendPushNotification } from '../services/fcmService.js';

const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Proyek tidak ditemukan');
  }

  const { userId, role } = req.user;
  const isOwner = project.owner.toString() === userId;
  const isMember = project.members.some((m) => m.toString() === userId);
  const isAssistant = project.assistants?.some((a) => a.toString() === userId);
  const isAdmin = role === ROLES.ADMIN;

  if (!isOwner && !isMember && !isAssistant && !isAdmin) {
    throw new ApiError(403, 'Anda tidak memiliki akses ke proyek ini');
  }

  const tasks = await Task.find({ project: projectId })
    .populate('assignee', 'fullName email avatar')
    .populate('reporter', 'fullName email avatar')
    .populate('reviewedBy', 'fullName email')
    .populate('attachments.uploadedBy', 'fullName email')
    .populate('comments.author', 'fullName email avatar')
    .sort({ position: 1 });

  res.json({
    success: true,
    data: { tasks },
  });
});

const createTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Proyek tidak ditemukan');
  }

  const { userId, role } = req.user;
  const isOwner = project.owner.toString() === userId;
  const isClaimedBy = project.claimedBy?.toString() === userId;
  const isAdmin = role === ROLES.ADMIN;

  if (!isClaimedBy && !isAdmin) {
    throw new ApiError(403, 'Hanya ketua kelompok atau admin yang bisa membuat task');
  }

  const { title, description, assignee, priority, points, dueDate } = req.body;

  const maxPosition = await Task.findOne({ project: projectId, status: TASK_STATUS.TODO })
    .sort({ position: -1 })
    .select('position');

  const task = await Task.create({
    title,
    description,
    project: projectId,
    assignee: assignee || null,
    reporter: userId,
    priority,
    points: points || 0,
    dueDate: dueDate || null,
    position: (maxPosition?.position || 0) + 1,
  });

  if (assignee && assignee !== userId) {
    const reporter = await User.findById(userId);

    await Notification.create({
      recipient: assignee,
      sender: userId,
      type: NOTIFICATION_TYPE.TASK_ASSIGNED,
      title: 'Task Baru',
      message: `${reporter.fullName} menugaskan "${title}" kepada Anda`,
      relatedProject: projectId,
      relatedTask: task._id,
    });

    // Send high priority notification
    if (priority === TASK_PRIORITY.HIGH || priority === TASK_PRIORITY.CRITICAL) {
      await Notification.create({
        recipient: assignee,
        sender: userId,
        type: NOTIFICATION_TYPE.HIGH_PRIORITY_TASK,
        title: `Task Prioritas ${priority === TASK_PRIORITY.CRITICAL ? 'Critical' : 'High'}`,
        message: `Anda mendapat task "${title}" dengan prioritas ${priority.toUpperCase()}`,
        relatedProject: projectId,
        relatedTask: task._id,
      });
    }

    const assigneeUser = await User.findById(assignee);
    if (assigneeUser?.fcmToken) {
      await sendPushNotification(
        assigneeUser.fcmToken,
        'Task Baru',
        `${reporter.fullName} menugaskan "${title}" kepada Anda`
      );
    }
  }

  const populated = await Task.findById(task._id)
    .populate('assignee', 'fullName email avatar')
    .populate('reporter', 'fullName email avatar');

  res.status(201).json({
    success: true,
    message: 'Task berhasil dibuat',
    data: { task: populated },
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw new ApiError(404, 'Task tidak ditemukan');
  }

  const project = await Project.findById(task.project);
  const { userId, role } = req.user;
  const isAssignee = task.assignee?.toString() === userId;
  const isClaimedBy = project?.claimedBy?.toString() === userId;
  const isOwner = project?.owner.toString() === userId;
  const isAdmin = role === ROLES.ADMIN;

  if (!isAssignee && !isClaimedBy && !isOwner && !isAdmin) {
    throw new ApiError(403, 'Anda tidak memiliki izin untuk mengubah task ini');
  }

  const { title, description, assignee, status, priority, points, dueDate } = req.body;

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (assignee !== undefined) task.assignee = assignee;
  if (priority !== undefined) task.priority = priority;
  if (points !== undefined) task.points = points;
  if (dueDate !== undefined) task.dueDate = dueDate;

  if (status !== undefined) {
    task.status = status;
    if (status === TASK_STATUS.DONE && !task.completedAt) {
      task.completedAt = new Date();
    }
    if (status !== TASK_STATUS.DONE) {
      task.completedAt = null;
    }
  }

  await task.save();

  const populated = await Task.findById(task._id)
    .populate('assignee', 'fullName email avatar')
    .populate('reporter', 'fullName email avatar')
    .populate('reviewedBy', 'fullName email')
    .populate('attachments.uploadedBy', 'fullName email')
    .populate('comments.author', 'fullName email avatar');

  res.json({
    success: true,
    message: 'Task berhasil diperbarui',
    data: { task: populated },
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw new ApiError(404, 'Task tidak ditemukan');
  }

  const project = await Project.findById(task.project);
  const { userId, role } = req.user;
  const isClaimedBy = project?.claimedBy?.toString() === userId;
  const isOwner = project?.owner.toString() === userId;
  const isAdmin = role === ROLES.ADMIN;

  if (!isClaimedBy && !isOwner && !isAdmin) {
    throw new ApiError(403, 'Anda tidak memiliki izin untuk menghapus task ini');
  }

  await Task.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Task berhasil dihapus',
  });
});

const submitTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task tidak ditemukan');

  const { userId } = req.user;
  if (task.assignee?.toString() !== userId) {
    throw new ApiError(403, 'Hanya assignee yang bisa mengunggah hasil task');
  }

  if (!req.file) {
    throw new ApiError(400, 'File wajib diunggah');
  }

  task.attachments.push({
    fileName: req.file.originalname,
    filePath: req.file.path.replace(/\\/g, '/'),
    fileSize: req.file.size,
    uploadedBy: userId,
    uploadedAt: new Date(),
  });

  const project = await Project.findById(task.project);
  const isKetua = project?.claimedBy && project.claimedBy.toString() === userId;

  if (isKetua) {
    task.approvalStatus = APPROVAL_STATUS.APPROVED;
    task.status = TASK_STATUS.DONE;
    task.completedAt = new Date();
    task.revisionComment = '';
  } else {
    task.approvalStatus = APPROVAL_STATUS.PENDING;
    task.status = TASK_STATUS.REVIEW;
  }

  await task.save();

  // Notify ketua kelompok if submitted by a regular member
  if (!isKetua && project?.claimedBy) {
    const submitter = await User.findById(userId);
    await Notification.create({
      recipient: project.claimedBy,
      sender: userId,
      type: NOTIFICATION_TYPE.TASK_SUBMITTED,
      title: 'Task Disubmit',
      message: `${submitter.fullName} mengunggah hasil task "${task.title}"`,
      relatedProject: task.project,
      relatedTask: task._id,
    });
  }

  const populated = await Task.findById(task._id)
    .populate('assignee', 'fullName email avatar')
    .populate('reporter', 'fullName email avatar')
    .populate('reviewedBy', 'fullName email')
    .populate('attachments.uploadedBy', 'fullName email')
    .populate('comments.author', 'fullName email avatar');

  res.json({
    success: true,
    message: 'File berhasil diunggah',
    data: { task: populated },
  });
});

const reviewTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task tidak ditemukan');

  const project = await Project.findById(task.project);
  const { userId } = req.user;

  if (project?.claimedBy?.toString() !== userId) {
    throw new ApiError(403, 'Hanya ketua kelompok yang bisa review task');
  }

  // Ketua cannot review their own tasks
  if (task.assignee?.toString() === userId) {
    throw new ApiError(400, 'Anda tidak bisa mereview task sendiri');
  }

  const { action, comment } = req.body;

  if (action === 'approve') {
    task.approvalStatus = APPROVAL_STATUS.APPROVED;
    task.status = TASK_STATUS.DONE;
    task.completedAt = new Date();
    task.revisionComment = '';
  } else if (action === 'revision') {
    if (!comment || !comment.trim()) {
      throw new ApiError(400, 'Komentar revisi wajib diisi');
    }
    task.approvalStatus = APPROVAL_STATUS.REVISION;
    task.status = TASK_STATUS.IN_PROGRESS;
    task.revisionComment = comment;
    task.completedAt = null;
  } else {
    throw new ApiError(400, 'Action harus "approve" atau "revision"');
  }

  task.reviewedBy = userId;
  task.reviewedAt = new Date();
  await task.save();

  // Notify assignee
  if (task.assignee) {
    const reviewer = await User.findById(userId);
    const notifType = action === 'approve' ? NOTIFICATION_TYPE.TASK_APPROVED : NOTIFICATION_TYPE.TASK_REVISION;
    const notifTitle = action === 'approve' ? 'Task Disetujui' : 'Task Perlu Revisi';
    const notifMsg = action === 'approve'
      ? `${reviewer.fullName} menyetujui task "${task.title}"`
      : `${reviewer.fullName} meminta revisi task "${task.title}": ${comment}`;

    await Notification.create({
      recipient: task.assignee,
      sender: userId,
      type: notifType,
      title: notifTitle,
      message: notifMsg,
      relatedProject: task.project,
      relatedTask: task._id,
    });
  }

  const populated = await Task.findById(task._id)
    .populate('assignee', 'fullName email avatar')
    .populate('reporter', 'fullName email avatar')
    .populate('reviewedBy', 'fullName email')
    .populate('attachments.uploadedBy', 'fullName email')
    .populate('comments.author', 'fullName email avatar');

  res.json({
    success: true,
    message: action === 'approve' ? 'Task disetujui' : 'Revisi diminta',
    data: { task: populated },
  });
});

const addComment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task tidak ditemukan');

  const project = await Project.findById(task.project);
  const { userId } = req.user;
  const isMember = project?.members.some(m => m.toString() === userId);
  const isOwner = project?.owner.toString() === userId;
  const isAssistant = project?.assistants?.some(a => a.toString() === userId);

  if (!isMember && !isOwner && !isAssistant) {
    throw new ApiError(403, 'Anda tidak memiliki akses ke task ini');
  }

  const { content } = req.body;
  if (!content || !content.trim()) throw new ApiError(400, 'Komentar tidak boleh kosong');

  task.comments.push({
    content: content.trim(),
    author: userId,
    createdAt: new Date(),
  });
  await task.save();

  // Notify assignee if commenter is not the assignee
  if (task.assignee && task.assignee.toString() !== userId) {
    const commenter = await User.findById(userId);
    await Notification.create({
      recipient: task.assignee,
      sender: userId,
      type: NOTIFICATION_TYPE.TASK_COMMENT,
      title: 'Komentar Baru',
      message: `${commenter.fullName} mengomentari task "${task.title}"`,
      relatedProject: task.project,
      relatedTask: task._id,
    });
  }

  const populated = await Task.findById(task._id)
    .populate('assignee', 'fullName email avatar')
    .populate('reporter', 'fullName email avatar')
    .populate('reviewedBy', 'fullName email')
    .populate('attachments.uploadedBy', 'fullName email')
    .populate('comments.author', 'fullName email avatar');

  res.json({
    success: true,
    message: 'Komentar berhasil ditambahkan',
    data: { task: populated },
  });
});

export { getTasks, createTask, updateTask, deleteTask, submitTask, reviewTask, addComment };
