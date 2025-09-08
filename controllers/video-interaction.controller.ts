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
      const { lawyerId, videoUrl } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Decode the video URL
      const decodedVideoUrl = decodeURIComponent(videoUrl);

      const result = await this.videoInteractionService.toggleLike(
        userId,
        lawyerId,
        decodedVideoUrl
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Toggle like error:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  };

  // Add a comment to a video
  addComment = async (req: Request, res: Response) => {
    try {
      const { lawyerId, videoUrl } = req.params;
      const { content } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      // Decode the video URL
      const decodedVideoUrl = decodeURIComponent(videoUrl);

      const comment = await this.videoInteractionService.addComment(
        userId,
        lawyerId,
        decodedVideoUrl,
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
      const { lawyerId, videoUrl } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Decode the video URL
      const decodedVideoUrl = decodeURIComponent(videoUrl);

      const comments = await this.videoInteractionService.getComments(
        lawyerId,
        decodedVideoUrl,
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
      const { lawyerId, videoUrl } = req.params;
      const userId = (req as any).user?.id;

      // Decode the video URL
      const decodedVideoUrl = decodeURIComponent(videoUrl);

      const stats = await this.videoInteractionService.getVideoStats(
        lawyerId,
        decodedVideoUrl,
        userId
      );

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
