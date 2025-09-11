import { Router } from 'express';
import { PublicController } from '../controllers/public.controller';

const router = Router();
const publicController = new PublicController();

// Platform statistics
router.get('/platform-stats', (req, res) => publicController.getPlatformStats(req, res));

// Latest videos
router.get('/videos/latest', (req, res) => publicController.getLatestVideos(req, res));

// Testimonials
router.get('/testimonials', (req, res) => publicController.getTestimonials(req, res));

// Practice areas
router.get('/practice-areas', (req, res) => publicController.getPracticeAreas(req, res));

export default router;
