import asyncHandler from 'express-async-handler';
import Note from '../models/Note.js';
import { apiResponse } from '../utils/apiResponse.js';

// GET /api/v1/followups ?range=today|week|overdue
export const getFollowups = asyncHandler(async (req, res) => {
  const { range } = req.query;
  
  const query = {
    isFollowUp: true,
    followUpDate: { $exists: true, $ne: null },
    createdBy: req.user._id
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  if (range === 'today') {
    query.followUpDate = { $gte: today, $lt: tomorrow };
  } else if (range === 'overdue') {
    query.followUpDate = { $lt: today };
  } else if (range === 'week' || range === 'this_week') {
    query.followUpDate = { $gte: tomorrow, $lt: nextWeek }; // Upcoming within a week (excluding today)
  }

  const followups = await Note.find(query)
    .populate('leadId', 'name company priority')
    .sort({ followUpDate: 1 });

  return apiResponse(res, 200, followups);
});
