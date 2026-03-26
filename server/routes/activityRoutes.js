import express from 'express';
import { getActivitiesByLead, addActivity } from '../controllers/activityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/:leadId')
  .get(protect, getActivitiesByLead)
  .post(protect, addActivity);

export default router;
