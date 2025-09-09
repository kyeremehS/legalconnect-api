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
  
  // Toggle like/unlike for a video
  async toggleLike(userId: string, lawyerId: string, videoUrl: string) {
    try {
      console.log('=== SERVICE TOGGLE LIKE START ===');
      console.log('Service parameters:', { userId, lawyerId, videoUrl });

      // Test the database connection first
      console.log('Testing database connection...');
      await prisma.$connect();
      console.log('Database connection successful');

      // Test if VideoLike table exists by trying a simple query
      console.log('Testing VideoLike table access...');
      const testCount = await prisma.videoLike.count();
      console.log('VideoLike table accessible, current count:', testCount);

      // Check if user already liked this video
      console.log('Checking for existing like...');
      const existingLike = await prisma.videoLike.findUnique({
        where: {
          userId_lawyerId_videoUrl: {
            userId,
            lawyerId,
            videoUrl
          }
        }
      });

      console.log('Existing like result:', existingLike);

      if (existingLike) {
        console.log('Removing existing like...');
        // Unlike - remove the like
        await prisma.videoLike.delete({
          where: {
            id: existingLike.id
          }
        });

        // Get updated like count
        console.log('Getting updated like count after unlike...');
        const likeCount = await prisma.videoLike.count({
          where: {
            lawyerId,
            videoUrl
          }
        });

        console.log('Unlike complete. Like count:', likeCount);

        return {
          liked: false,
          likeCount,
          action: 'unliked',
          message: 'Video unliked successfully'
        };
      } else {
        console.log('Adding new like...');
        // Like - add the like
        const newLike = await prisma.videoLike.create({
          data: {
            userId,
            lawyerId,
            videoUrl
          }
        });

        console.log('New like created:', newLike);

        // Get updated like count
        console.log('Getting updated like count after like...');
        const likeCount = await prisma.videoLike.count({
          where: {
            lawyerId,
            videoUrl
          }
        });

        console.log('Like complete. Like count:', likeCount);

        return {
          liked: true,
          likeCount,
          action: 'liked',
          message: 'Video liked successfully'
        };
      }
    } catch (error) {
      console.error('=== SERVICE TOGGLE LIKE ERROR ===');
      console.error('Toggle like service error:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack'
      });
      
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Database operation failed: ${error.message}`);
      } else {
        throw new Error('Unknown database error occurred');
      }
    }
  }

  // Add a comment to a video
  async addComment(userId: string, lawyerId: string, videoUrl: string, content: string) {
    try {
      const comment = await prisma.videoComment.create({
        data: {
          userId,
          lawyerId,
          videoUrl,
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

      return comment;
    } catch (error) {
      console.error('Add comment error:', error);
      throw new Error('Failed to add comment');
    }
  }

  // Get comments for a video with pagination
  async getComments(lawyerId: string, videoUrl: string, page: number = 1, limit: number = 10): Promise<CommentsResponse> {
    try {
      const skip = (page - 1) * limit;

      const [comments, total] = await Promise.all([
        prisma.videoComment.findMany({
          where: {
            lawyerId,
            videoUrl
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
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.videoComment.count({
          where: {
            lawyerId,
            videoUrl
          }
        })
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
      console.error('Get comments error:', error);
      throw new Error('Failed to get comments');
    }
  }

  // Get video statistics
  async getVideoStats(lawyerId: string, videoUrl: string, userId?: string): Promise<VideoStats> {
    try {
      const [likesCount, commentsCount, viewsCount, userLike, userViewed] = await Promise.all([
        prisma.videoLike.count({
          where: {
            lawyerId,
            videoUrl
          }
        }),
        prisma.videoComment.count({
          where: {
            lawyerId,
            videoUrl
          }
        }),
        prisma.videoView.count({
          where: {
            lawyerId,
            videoUrl
          }
        }),
        userId ? prisma.videoLike.findUnique({
          where: {
            userId_lawyerId_videoUrl: {
              userId,
              lawyerId,
              videoUrl
            }
          }
        }) : null,
        userId ? prisma.videoView.findFirst({
          where: {
            lawyerId,
            videoUrl,
            userId
          }
        }) : null
      ]);

      return {
        likeCount: likesCount,
        commentCount: commentsCount,
        viewCount: viewsCount,
        userLiked: !!userLike,
        userViewed: !!userViewed
      };
    } catch (error) {
      console.error('Get video stats error:', error);
      throw new Error('Failed to get video stats');
    }
  }

  // Delete a comment (only by the comment author)
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    try {
      const comment = await prisma.videoComment.findUnique({
        where: {
          id: commentId
        }
      });

      if (!comment || comment.userId !== userId) {
        return false;
      }

      await prisma.videoComment.delete({
        where: {
          id: commentId
        }
      });

      return true;
    } catch (error) {
      console.error('Delete comment error:', error);
      throw new Error('Failed to delete comment');
    }
  }

  // Record a video view (can be called multiple times by same user)
  async recordVideoView(lawyerId: string, videoUrl: string, userId?: string, duration?: number) {
    try {
      console.log('Recording video view:', { lawyerId, videoUrl, userId, duration });

      const viewData: any = {
        lawyerId,
        videoUrl,
        viewedAt: new Date()
      };

      // Add optional fields if provided
      if (userId) {
        viewData.userId = userId;
      }
      if (duration) {
        viewData.duration = duration;
      }

      const view = await prisma.videoView.create({
        data: viewData
      });

      console.log('Video view recorded:', view.id);
      return { success: true, viewId: view.id };
    } catch (error) {
      console.error('Record video view error:', error);
      throw new Error('Failed to record video view');
    }
  }

  // Get unique view count (count distinct users + anonymous views)
  async getVideoViewCount(lawyerId: string, videoUrl: string): Promise<number> {
    try {
      const viewCount = await prisma.videoView.count({
        where: {
          lawyerId,
          videoUrl
        }
      });

      return viewCount;
    } catch (error) {
      console.error('Get video view count error:', error);
      return 0;
    }
  }

  // Check if user has viewed this video
  async hasUserViewedVideo(lawyerId: string, videoUrl: string, userId: string): Promise<boolean> {
    try {
      const view = await prisma.videoView.findFirst({
        where: {
          lawyerId,
          videoUrl,
          userId
        }
      });

      return !!view;
    } catch (error) {
      console.error('Check user viewed video error:', error);
      return false;
    }
  }
}
