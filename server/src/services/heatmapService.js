import Task from '../models/Task.js';
import { TASK_STATUS } from '../utils/constants.js';

const getProjectHeatmap = async (projectId) => {
  const tasks = await Task.find({
    project: projectId,
    status: TASK_STATUS.DONE,
    completedAt: { $ne: null },
  }).populate('assignee', 'fullName email');

  const heatmapData = {};

  tasks.forEach((task) => {
    if (!task.assignee || !task.completedAt) return;

    const userId = task.assignee._id.toString();
    const dateKey = task.completedAt.toISOString().split('T')[0];

    if (!heatmapData[userId]) {
      heatmapData[userId] = {
        user: {
          _id: task.assignee._id,
          fullName: task.assignee.fullName,
          email: task.assignee.email,
        },
        contributions: {},
        totalPoints: 0,
      };
    }

    if (!heatmapData[userId].contributions[dateKey]) {
      heatmapData[userId].contributions[dateKey] = 0;
    }

    heatmapData[userId].contributions[dateKey] += task.points || 1;
    heatmapData[userId].totalPoints += task.points || 1;
  });

  return Object.values(heatmapData);
};

const getUserHeatmap = async (userId) => {
  const tasks = await Task.find({
    assignee: userId,
    status: TASK_STATUS.DONE,
    completedAt: { $ne: null },
  });

  const contributions = {};
  let totalPoints = 0;

  tasks.forEach((task) => {
    const dateKey = task.completedAt.toISOString().split('T')[0];
    if (!contributions[dateKey]) {
      contributions[dateKey] = 0;
    }
    contributions[dateKey] += task.points || 1;
    totalPoints += task.points || 1;
  });

  return { contributions, totalPoints };
};

export { getProjectHeatmap, getUserHeatmap };
