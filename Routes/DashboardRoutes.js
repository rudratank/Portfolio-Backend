import expres from 'express'
import { getDashboardStats } from '../Controller/DashboardController.js';
import { verifyToken } from '../Middleware/Authatication.js';
import { trackPageView } from '../Middleware/TrackPageviewMiddleware.js';
const router = expres.Router();

router.get('/stats',verifyToken,trackPageView, getDashboardStats);

export default router;