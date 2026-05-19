import asyncHandler from '../utils/asyncHandler.js';
import { getProjectHeatmap, getUserHeatmap } from '../services/heatmapService.js';

const getProjectHeatmapData = asyncHandler(async (req, res) => {
  const data = await getProjectHeatmap(req.params.projectId);
  res.json({ success: true, data: { heatmap: data } });
});

const getUserHeatmapData = asyncHandler(async (req, res) => {
  const data = await getUserHeatmap(req.params.userId);
  res.json({ success: true, data: { heatmap: data } });
});

export { getProjectHeatmapData, getUserHeatmapData };
