import { Router } from 'express';
import { VideoInteractionController } from '../controllers/video-interaction.controller';
import { VideoInteractionService } from '../services/video-interaction.service';
import { authenticate, authorize } from '../middlewares/Auth.middleware';
import prisma from '../prisma/prismaClient';

const router = Router();
const videoInteractionController = new VideoInteractionController();
const videoInteractionService = new VideoInteractionService();

console.log('Video interaction routes being registered...');

// Log all requests to this router
router.use((req, res, next) => {
  console.log(`VIDEO ROUTES: ${req.method} ${req.path} - Query:`, req.query);
  next();
});

// Test/health routes (public for compat — frontend GET_VIDEO_STATS uses /test-stats-simple)
router.get('/test', (req, res) => {
  res.json({ message: 'Video interaction routes are working!' });
});

router.get('/test-stats', (req, res) => {
  res.json({ message: 'Test stats route reached', query: req.query });
});

router.get('/test-stats-simple', (req, res) => {
  res.json({ 
    success: true,
    data: { likeCount: 0, commentCount: 0, userLiked: false },
    message: 'Simple test stats response'
  });
});

// Debug routes below expose DB contents / mutate likes — admin only.
router.get('/test-users', authenticate, authorize('ADMIN'), async (req, res) => {
  console.log('=== TEST USERS ROUTE HIT ===');
  
  try {
    // Get existing users from database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      },
      take: 5
    });
    
    console.log('Found users:', users);
    
    res.json({ 
      success: true, 
      data: { users, count: users.length },
      message: 'User lookup successful' 
    });
    
  } catch (error) {
    console.error('=== TEST USERS ERROR ===');
    console.error('Error details:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'User lookup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/test-like-real', authenticate, authorize('ADMIN'), async (req, res) => {
  console.log('=== TEST LIKE REAL ROUTE HIT ===');
  console.log('Query parameters:', req.query);
  
  try {
    // Use real IDs from the database
    const realUserId = 'cmf5fd81h000094yk9hpannun'; // Samuel Kyeremeh (CLIENT)
    const realLawyerId = 'cmebptmg00002940ootz16ivm'; // Abena & Associates
    const testVideoId = 'test-video-id';
    
    console.log('Calling real toggle service with real IDs:', { 
      realUserId, 
      realLawyerId, 
      testVideoId 
    });
    
    const result = await videoInteractionService.toggleVideoLike(
      realUserId, 
      realLawyerId, 
      testVideoId
    );
    
    console.log('Service returned:', result);
    
    res.json({ 
      success: true, 
      data: result,
      message: 'Real like functionality test successful with real database IDs!',
      debug: {
        userId: realUserId,
        lawyerId: realLawyerId,
        videoId: testVideoId
      }
    });
    
  } catch (error) {
    console.error('=== TEST LIKE REAL ERROR ===');
    console.error('Error details:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Test like with real IDs failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/test-like', authenticate, authorize('ADMIN'), async (req, res) => {
  console.log('=== TEST LIKE ROUTE HIT ===');
  console.log('Request body:', req.body);
  
  try {
    // Call the real service with test data
    const testUserId = 'test-user-123';
    const { lawyerId, videoId } = req.body;
    
    if (!lawyerId || !videoId) {
      console.log('Missing lawyerId or videoId');
      return res.status(400).json({
        success: false,
        message: 'lawyerId and videoId are required'
      });
    }

    console.log('Calling real toggle service...');
    const result = await videoInteractionService.toggleVideoLike(
      testUserId, 
      lawyerId, 
      videoId
    );
    
    console.log('Service returned:', result);
    
    res.json({ 
      success: true, 
      data: result,
      message: 'Real like functionality test successful' 
    });
    
  } catch (error) {
    console.error('=== TEST LIKE ERROR ===');
    console.error('Error details:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Test like failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Public endpoints (no authentication required)
router.post('/view', videoInteractionController.recordVideoView);

// All API routes below require authentication
router.use(authenticate);

// Real video interaction endpoints
router.post('/like', videoInteractionController.toggleLike);
router.post('/comment', videoInteractionController.addComment);
router.get('/comments', videoInteractionController.getComments);
router.get('/stats', videoInteractionController.getVideoStats);

// Delete a comment
router.delete('/comment/:commentId', videoInteractionController.deleteComment);

export default router;
