import { Request, Response } from 'express';
import { VideoInteractionService } from '../services/video-interaction.service';

export class VideoInteractionController {
  private videoInteractionService: VideoInteractionService;

  constructor() {
    this.videoInteractionService = new VideoInteractionService();
  }

  // Like/Unlike a video
  toggleLike = async (req: Request, res: Response) => {
    try {
      console.log('=== TOGGLE LIKE START ===');
      console.log('Toggle like request received:', {
        body: req.body,
        method: req.method,
        path: req.path,
        user: (req as any).user?.id
      });

      const { lawyerId, videoUrl } = req.body;
      const userId = (req as any).user?.id;

      console.log('Extracted parameters:', { userId, lawyerId, videoUrl });

      if (!userId) {
        console.log('ERROR: No userId found');
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!lawyerId || !videoUrl) {
        console.log('ERROR: Missing parameters', { lawyerId: !!lawyerId, videoUrl: !!videoUrl });
        return res.status(400).json({ error: 'lawyerId and videoUrl are required' });
      }

      console.log('Processing like toggle:', { userId, lawyerId, videoUrl });

      try {
        const result = await this.videoInteractionService.toggleLike(
          userId,
          lawyerId,
          videoUrl
        );

        console.log('Service result:', result);

        res.json({
          success: true,
          data: result
        });
        console.log('=== TOGGLE LIKE SUCCESS ===');
      } catch (serviceError) {
        console.error('Service error details:', serviceError);
        throw serviceError;
      }
    } catch (error) {
      console.error('=== TOGGLE LIKE ERROR ===');
      console.error('Toggle like error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  };

  // Add a comment to a video
  addComment = async (req: Request, res: Response) => {
    try {
      const { lawyerId, videoUrl, content } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!lawyerId || !videoUrl) {
        return res.status(400).json({ error: 'lawyerId and videoUrl are required' });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      const comment = await this.videoInteractionService.addComment(
        userId,
        lawyerId,
        videoUrl,
        content.trim()
      );

      res.json({
        success: true,
        data: comment
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  };

  // Get comments for a video
  getComments = async (req: Request, res: Response) => {
    try {
      const { lawyerId, videoUrl } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!lawyerId || !videoUrl) {
        return res.status(400).json({ error: 'lawyerId and videoUrl are required' });
      }

      const comments = await this.videoInteractionService.getComments(
        lawyerId as string,
        videoUrl as string,
        page,
        limit
      );

      res.json({
        success: true,
        data: comments
      });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  };

  // Get video stats (likes count, comments count)
  getVideoStats = async (req: Request, res: Response) => {
    try {
      console.log('Get video stats request received:', {
        query: req.query,
        method: req.method,
        path: req.path,
        user: (req as any).user?.id
      });

      const { lawyerId, videoUrl } = req.query;
      const userId = (req as any).user?.id;

      if (!lawyerId || !videoUrl) {
        console.log('Missing parameters:', { lawyerId, videoUrl });
        return res.status(400).json({ error: 'lawyerId and videoUrl are required' });
      }

      console.log('Fetching stats for:', { lawyerId, videoUrl, userId });

      const stats = await this.videoInteractionService.getVideoStats(
        lawyerId as string,
        videoUrl as string,
        userId
      );

      console.log('Stats retrieved:', stats);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get video stats error:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  };

  // Delete a comment (only by comment author)
  deleteComment = async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const success = await this.videoInteractionService.deleteComment(
        commentId,
        userId
      );

      if (success) {
        res.json({ 
          success: true,
          message: 'Comment deleted successfully' 
        });
      } else {
        res.status(403).json({ 
          success: false,
          error: 'Unauthorized to delete this comment' 
        });
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  };
}
