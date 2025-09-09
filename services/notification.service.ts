import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationService {
  async createNotification(notificationData: {
    userId: string;
    title: string;
    message: string;
    type: string;
    data?: any;
  }) {
    return await prisma.notification.create({
      data: {
        ...notificationData,
        type: notificationData.type as NotificationType
      }
    });
  }

  async getNotifications(userId: string, unreadOnly: boolean = false) {
    const where: any = { userId };
    
    if (unreadOnly) {
      where.isRead = false;
    }

    return await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to last 50 notifications
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: {
        isRead: true
      }
    });
  }

  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    return await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId
      }
    });
  }

  async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });
  }
}
