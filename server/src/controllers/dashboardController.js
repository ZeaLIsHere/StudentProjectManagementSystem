import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ROLES, PROJECT_STATUS, TASK_STATUS, APPROVAL_STATUS } from '../utils/constants.js';

const getProjectFilter = (userId, role) => {
  switch (role) {
    case ROLES.ADMIN:
      return {};
    case ROLES.DOSEN:
      return { owner: userId };
    case ROLES.ASISTEN_DOSEN:
      return { assistants: userId };
    case ROLES.MAHASISWA_KETUA:
      return { claimedBy: userId };
    case ROLES.MAHASISWA_ANGGOTA:
      return { members: userId };
    default:
      return { members: userId };
  }
};

const getDashboardStats = asyncHandler(async (req, res) => {
  const { userId, role } = req.user;
  const filter = getProjectFilter(userId, role);

  const projects = await Project.find(filter).select('_id status');
  const projectIds = projects.map((p) => p._id);

  const tasks =
    projectIds.length > 0
      ? await Task.find({ project: { $in: projectIds } }).select('status approvalStatus assignee dueDate')
      : [];

  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const unreadNotifications = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  const stats = {
    projects: projects.length,
    activeProjects: projects.filter((p) => p.status === PROJECT_STATUS.ACTIVE).length,
    openProjects: projects.filter((p) => p.status === PROJECT_STATUS.OPEN).length,
    tasks: tasks.length,
    tasksDone: tasks.filter((t) => t.status === TASK_STATUS.DONE).length,
    tasksInProgress: tasks.filter((t) => t.status === TASK_STATUS.IN_PROGRESS).length,
    tasksReview: tasks.filter((t) => t.status === TASK_STATUS.REVIEW).length,
    tasksTodo: tasks.filter((t) => t.status === TASK_STATUS.TODO).length,
    pendingReviews: tasks.filter((t) => t.approvalStatus === APPROVAL_STATUS.PENDING).length,
    upcomingDeadlines: tasks.filter(
      (t) => t.dueDate && t.status !== TASK_STATUS.DONE && new Date(t.dueDate) <= twoDaysFromNow
    ).length,
    unreadNotifications,
    assignedToMe: tasks.filter((t) => t.assignee?.toString() === userId).length,
    myTasksPending: tasks.filter(
      (t) => t.assignee?.toString() === userId && t.status !== TASK_STATUS.DONE
    ).length,
  };

  res.json({ success: true, data: { stats } });
});

export { getDashboardStats };
