import asyncHandler from 'express-async-handler';
import Activity from '../models/Activity.js';
import { apiResponse } from '../utils/apiResponse.js';

// @desc    Get activities for a specific lead
// @route   GET /api/v1/activities/:leadId
// @access  Private
export const getActivitiesByLead = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ lead: req.params.leadId })
    .populate('user', 'name')
    .sort({ createdAt: -1 });
  return apiResponse(res, 200, activities);
});

// @desc    Add a new activity
// @route   POST /api/v1/activities/:leadId
// @access  Private
export const addActivity = asyncHandler(async (req, res) => {
  const { type, description } = req.body;
  const activity = new Activity({
    lead: req.params.leadId,
    type,
    description,
    user: req.user._id
  });
  
  const createdActivity = await activity.save();
  return apiResponse(res, 201, createdActivity);
});
