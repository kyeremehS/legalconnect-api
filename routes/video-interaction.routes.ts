import { Router } from 'express';
import { VideoInteractionController } from '../controllers/video-interaction.controller';
import { authenticate } from '../middlewares/Auth.middleware';

const router = Router();
const videoInteractionController = new VideoInteractionController();

// All routes require authentication
router.use(authenticate);

// Like/Unlike a video
router.post('/lawyer/:lawyerId/video/:videoUrl/like', videoInteractionController.toggleLike);

// Comment on a video
router.post('/lawyer/:lawyerId/video/:videoUrl/comment', videoInteractionController.addComment);

// Get comments for a video
router.get('/lawyer/:lawyerId/video/:videoUrl/comments', videoInteractionController.getComments);

// Get video statistics
router.get('/lawyer/:lawyerId/video/:videoUrl/stats', videoInteractionController.getVideoStats);

// Delete a comment
router.delete('/comment/:commentId', videoInteractionController.deleteComment);

export default router;
