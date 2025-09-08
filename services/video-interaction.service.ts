import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export interface VideoStats {
  likesCount: number;
  commentsCount: number;
  isLikedByUser: boolean;
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
      // Check if user already liked this video
      const existingLike = await prisma.videoLike.findUnique({
        where: {
          userId_lawyerId_videoUrl: {
            userId,
            lawyerId,
            videoUrl
          }
        }
      });

      if (existingLike) {
        // Unlike - remove the like
        await prisma.videoLike.delete({
          where: {
            id: existingLike.id
          }
        });

        return {
          action: 'unliked',
          message: 'Video unliked successfully'
        };
      } else {
        // Like - add the like
        await prisma.videoLike.create({
          data: {
            userId,
            lawyerId,
            videoUrl
          }
        });

        return {
          action: 'liked',
          message: 'Video liked successfully'
        };
      }
    } catch (error) {
      console.error('Toggle like error:', error);
      throw new Error('Failed to toggle like');
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
      const [likesCount, commentsCount, userLike] = await Promise.all([
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
        userId ? prisma.videoLike.findUnique({
          where: {
            userId_lawyerId_videoUrl: {
              userId,
              lawyerId,
              videoUrl
            }
          }
        }) : null
      ]);

      return {
        likesCount,
        commentsCount,
        isLikedByUser: !!userLike
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
}
