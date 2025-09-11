import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test database connection on service load
(async () => {
  try {
    console.log('Testing Prisma database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
})();

export interface VideoStats {
  likeCount: number;
  commentCount: number;
  viewCount: number;
  userLiked: boolean;
  userViewed: boolean;
}

export interface CommentWithUser {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export interface CommentsResponse {
  comments: CommentWithUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class VideoInteractionService {
  
  /**
   * Toggle like on a video
   */
  async toggleVideoLike(userId: string, lawyerId: string, videoId: string): Promise<{ liked: boolean; totalLikes: number }> {
    try {
      // Check if user already liked this video
      const existingLike = await prisma.videoLike.findUnique({
        where: {
          userId_videoId: {
            userId,
            videoId
          }
        }
      });

      if (existingLike) {
        // Unlike the video
        await prisma.videoLike.delete({
          where: {
            userId_videoId: {
              userId,
              videoId
            }
          }
        });
      } else {
        // Like the video
        await prisma.videoLike.create({
          data: {
            userId,
            lawyerId,
            videoId
          }
        });
      }

      // Get total likes count
      const totalLikes = await prisma.videoLike.count({
        where: {
          videoId
        }
      });

      return {
        liked: !existingLike,
        totalLikes
      };
    } catch (error) {
      console.error('Error toggling video like:', error);
      throw new Error('Failed to toggle video like');
    }
  }

  /**
   * Get video statistics including likes, comments, views
   */
  async getVideoStats(videoId: string, userId?: string): Promise<VideoStats> {
    try {
      const [likeCount, commentCount, viewCount, userLiked] = await Promise.all([
        prisma.videoLike.count({ where: { videoId } }),
        prisma.videoComment.count({ where: { videoId } }),
        prisma.videoView.count({ where: { videoId } }),
        userId ? prisma.videoLike.findUnique({
          where: {
            userId_videoId: {
              userId,
              videoId
            }
          }
        }) : null
      ]);

      const userViewed = userId ? await prisma.videoView.findFirst({
        where: {
          userId,
          videoId
        }
      }) : null;

      return {
        likeCount,
        commentCount,
        viewCount,
        userLiked: !!userLiked,
        userViewed: !!userViewed
      };
    } catch (error) {
      console.error('Error getting video stats:', error);
      throw new Error('Failed to get video statistics');
    }
  }

  /**
   * Add a comment to a video
   */
  async addComment(userId: string, lawyerId: string, videoId: string, content: string) {
    try {
      const comment = await prisma.videoComment.create({
        data: {
          userId,
          lawyerId,
          videoId,
          content
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      return {
        success: true,
        comment
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  }

  /**
   * Get comments for a video with pagination
   */
  async getComments(videoId: string, page: number = 1, limit: number = 10): Promise<CommentsResponse> {
    try {
      const skip = (page - 1) * limit;

      const [comments, total] = await Promise.all([
        prisma.videoComment.findMany({
          where: { videoId },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.videoComment.count({ where: { videoId } })
      ]);

      return {
        comments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting comments:', error);
      throw new Error('Failed to get comments');
    }
  }

  /**
   * Record a video view
   */
  async recordView(userId: string | null, lawyerId: string, videoId: string, duration?: number) {
    try {
      await prisma.videoView.create({
        data: {
          userId,
          lawyerId,
          videoId,
          duration
        }
      });

      // Update video view count
      await prisma.video.update({
        where: { id: videoId },
        data: {
          views: {
            increment: 1
          }
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error recording view:', error);
      throw new Error('Failed to record view');
    }
  }

  /**
   * Delete a comment (only by the comment author)
   */
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    try {
      const comment = await prisma.videoComment.findUnique({
        where: { id: commentId }
      });

      if (!comment || comment.userId !== userId) {
        return false;
      }

      await prisma.videoComment.delete({
        where: { id: commentId }
      });

      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error('Failed to delete comment');
    }
  }

  /**
   * Get analytics for a video
   */
  async getVideoAnalytics(videoId: string) {
    try {
      const [video, totalViews, totalLikes, totalComments, avgDuration] = await Promise.all([
        prisma.video.findUnique({
          where: { id: videoId },
          select: { views: true }
        }),
        prisma.videoView.count({ where: { videoId } }),
        prisma.videoLike.count({ where: { videoId } }),
        prisma.videoComment.count({ where: { videoId } }),
        prisma.videoView.aggregate({
          where: { videoId, duration: { not: null } },
          _avg: { duration: true }
        })
      ]);

      return {
        totalViews: video?.views || 0,
        totalLikes,
        totalComments,
        averageViewDuration: avgDuration._avg.duration || 0
      };
    } catch (error) {
      console.error('Error getting video analytics:', error);
      throw new Error('Failed to get video analytics');
    }
  }
}

export default new VideoInteractionService();