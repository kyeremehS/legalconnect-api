import { Request, Response } from 'express';
import prisma from '../prisma/prismaClient';

export class DashboardController {
  
  /**
   * Get user dashboard data including appointments, messages, videos, and statistics
   */
  async getUserDashboardData(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      // Get user with appointments, messages, and statistics
      const [
        upcomingAppointments,
        recentMessages,
        recentVideos,
        userStats
      ] = await Promise.all([
        // Upcoming appointments (next 5)
        prisma.appointment.findMany({
          where: {
            clientId: userId,
            startTime: {
              gte: new Date()
            },
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          },
          include: {
            lawyer: {
              include: {
                user: true
              }
            }
          },
          orderBy: {
            startTime: 'asc'
          },
          take: 5
        }),

        // Recent messages (last 5)
        prisma.message.findMany({
          where: {
            OR: [
              { senderId: userId },
              { receiverId: userId }
            ]
          },
          include: {
            sender: true,
            receiver: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }),

        // Recently uploaded videos (last 5)
        prisma.video.findMany({
          include: {
            lawyer: {
              include: {
                user: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }),

        // User statistics
        Promise.all([
          // Total appointments
          prisma.appointment.count({
            where: { clientId: userId }
          }),
          // Total messages
          prisma.message.count({
            where: {
              OR: [
                { senderId: userId },
                { receiverId: userId }
              ]
            }
          }),
          // Videos watched (based on video views)
          prisma.videoView.count({
            where: { userId: userId }
          }),
          // Upcoming appointments
          prisma.appointment.count({
            where: {
              clientId: userId,
              startTime: {
                gte: new Date()
              },
              status: {
                in: ['PENDING', 'CONFIRMED']
              }
            }
          })
        ])
      ]);

      // Format user statistics
      const [totalAppointments, totalMessages, videosWatched, upcomingCount] = userStats;

      const formattedStats = [
        { 
          label: "Active Consultations", 
          value: upcomingCount.toString(), 
          change: upcomingCount > 0 ? "Scheduled" : "None" 
        },
        { 
          label: "Messages", 
          value: totalMessages.toString(), 
          change: totalMessages > 0 ? "Active" : "Start chatting" 
        },
        { 
          label: "Videos Watched", 
          value: videosWatched.toString(), 
          change: videosWatched > 0 ? "Keep learning" : "Start watching" 
        },
      ];

      // Format recent activities based on actual data
      const recentActivities: any[] = [];
      
      // Add upcoming appointments as activities
      upcomingAppointments.slice(0, 2).forEach(appointment => {
        recentActivities.push({
          id: `appointment-${appointment.id}`,
          title: `📅 Appointment with ${appointment.lawyer.user?.fullName || appointment.lawyer.user?.firstName}`,
          time: this.formatTimeAgo(appointment.createdAt),
          type: "appointment",
          data: appointment
        });
      });

      // Add recent messages as activities
      recentMessages.slice(0, 2).forEach(message => {
        const isFromUser = message.senderId === userId;
        const otherPerson = isFromUser ? message.receiver : message.sender;
        recentActivities.push({
          id: `message-${message.id}`,
          title: `💬 ${isFromUser ? 'Sent message to' : 'Received message from'} ${otherPerson?.fullName || otherPerson?.firstName}`,
          time: this.formatTimeAgo(message.createdAt),
          type: "message",
          data: message
        });
      });

      // Add recent videos as activities
      recentVideos.slice(0, 2).forEach(video => {
        recentActivities.push({
          id: `video-${video.id}`,
          title: `🎥 New video: "${video.title}" by ${video.lawyer.user?.fullName || video.lawyer.user?.firstName}`,
          time: this.formatTimeAgo(video.createdAt),
          type: "video",
          data: video
        });
      });

      // If no activities, add welcome activities
      if (recentActivities.length === 0) {
        recentActivities.push(
          {
            id: "welcome-1",
            title: "🇬🇭 Welcome to Ghana's Premier Legal Platform",
            time: "Just now",
            type: "welcome",
          },
          {
            id: "welcome-2",
            title: "📚 Explore 50+ legal articles and educational videos",
            time: "Getting started",
            type: "tip",
          },
          {
            id: "welcome-3",
            title: "👤 Complete your profile to find the best lawyer matches",
            time: "Recommended",
            type: "profile"
          }
        );
      }

      // Sort activities by time (most recent first)
      recentActivities.sort((a: any, b: any) => {
        if (a.data && b.data) {
          return new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime();
        }
        return 0;
      });

      res.json({
        success: true,
        data: {
          statistics: formattedStats,
          upcomingAppointments: upcomingAppointments.map(apt => ({
            id: apt.id,
            title: apt.title,
            lawyerName: apt.lawyer.user?.fullName || `${apt.lawyer.user?.firstName} ${apt.lawyer.user?.lastName}`,
            date: apt.startTime.toISOString().split('T')[0],
            time: apt.startTime.toTimeString().slice(0, 5),
            type: apt.meetingType,
            status: apt.status,
            practiceArea: apt.practiceArea
          })),
          recentMessages: recentMessages.map(msg => ({
            id: msg.id,
            content: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
            senderName: msg.sender?.fullName || msg.sender?.firstName,
            receiverName: msg.receiver?.fullName || msg.receiver?.firstName,
            isFromUser: msg.senderId === userId,
            time: this.formatTimeAgo(msg.createdAt),
            readAt: msg.readAt
          })),
          recentVideos: recentVideos.map(video => ({
            id: video.id,
            title: video.title,
            description: video.description.substring(0, 100) + (video.description.length > 100 ? '...' : ''),
            lawyerName: video.lawyer.user?.fullName || video.lawyer.user?.firstName,
            category: video.category,
            views: video.views,
            uploadedAt: this.formatTimeAgo(video.createdAt),
            thumbnail: video.thumbnail,
            duration: video.duration
          })),
          recentActivities: recentActivities.slice(0, 5)
        }
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard data'
      });
    }
  }

  /**
   * Helper function to format time ago
   */
  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  }
}
