import { Request, Response } from 'express';
import { AppointmentService } from '../services/appointment.service';
import { NotificationService } from '../services/notification.service';
import { PrismaClient } from '@prisma/client';

const appointmentService = new AppointmentService();
const notificationService = new NotificationService();
const prisma = new PrismaClient();

export class AppointmentController {
  // Client books an appointment
  async createAppointment(req: Request, res: Response) {
    try {
      const appointmentData = req.body;
      const clientId = req.user?.id;
      
      if (!clientId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }
      
      const appointment = await appointmentService.createAppointment({
        ...appointmentData,
        clientId
      });
      
      return res.status(201).json({
        success: true,
        message: 'Appointment request sent successfully',
        data: appointment
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create appointment'
      });
    }
  }

  // Lawyer confirms/rejects appointment
  async updateAppointmentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Get lawyer record from user ID
      const lawyer = await prisma.lawyer.findUnique({
        where: { userId },
        select: { id: true }
      });

      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer profile not found'
        });
      }
      
      const appointment = await appointmentService.updateAppointmentStatus(
        id, 
        status, 
        lawyer.id,
        notes
      );
      
      return res.status(200).json({
        success: true,
        message: 'Appointment updated successfully',
        data: appointment
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update appointment'
      });
    }
  }

  // Get lawyer's appointments
  async getLawyerAppointments(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User ID not found in token'
        });
      }

      // Get lawyer record from user ID
      const lawyer = await prisma.lawyer.findUnique({
        where: { userId },
        select: { id: true }
      });

      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer profile not found'
        });
      }

      const { status, date } = req.query;
      
      // Validate date format if provided
      if (date && typeof date === 'string') {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid date format. Expected YYYY-MM-DD'
          });
        }
        
        // Validate that the date is actually valid
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid date value'
          });
        }
      }
      
      const appointments = await appointmentService.getLawyerAppointments(
        lawyer.id,
        {
          status: status as string,
          date: date as string
        }
      );
      
      return res.status(200).json({
        success: true,
        data: appointments
      });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch appointments'
      });
    }
  }

  // Get client's appointments
  async getClientAppointments(req: Request, res: Response) {
    try {
      const clientId = req.user?.id;
      const { status } = req.query;
      
      const appointments = await appointmentService.getClientAppointments(
        clientId as string,
        { status: status as string }
      );
      
      return res.status(200).json({
        success: true,
        data: appointments
      });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch appointments'
      });
    }
  }

  // Client cancels their own appointment
  async cancelClientAppointment(req: Request, res: Response) {
    try {
      const { id: appointmentId } = req.params;
      const clientId = req.user?.id;

      if (!clientId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      // Verify the appointment belongs to this client and is cancellable
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { 
          id: true, 
          clientId: true, 
          status: true,
          lawyer: {
            select: {
              user: {
                select: { id: true }
              }
            }
          }
        }
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      if (appointment.clientId !== clientId) {
        return res.status(403).json({
          success: false,
          message: 'You can only cancel your own appointments'
        });
      }

      if (appointment.status === 'CANCELLED') {
        return res.status(400).json({
          success: false,
          message: 'Appointment is already cancelled'
        });
      }

      if (appointment.status === 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel a completed appointment'
        });
      }

      // Update appointment status to CANCELLED
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELLED' },
        include: {
          client: {
            select: { firstName: true, lastName: true }
          }
        }
      });

      // Notify the lawyer about cancellation
      try {
        await notificationService.createNotification({
          userId: appointment.lawyer.user.id,
          title: 'Appointment Cancelled',
          message: `${updatedAppointment.client?.firstName} ${updatedAppointment.client?.lastName} has cancelled their appointment`,
          type: 'APPOINTMENT_CANCELLED',
          data: { appointmentId: updatedAppointment.id }
        });
      } catch (notificationError) {
        console.warn('Failed to send cancellation notification:', notificationError);
      }

      return res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: updatedAppointment
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel appointment'
      });
    }
  }

  // Get lawyer's availability
  async getLawyerAvailability(req: Request, res: Response) {
    try {
      const { lawyerId } = req.params;
      const { date } = req.query;
      
      const availability = await appointmentService.getLawyerAvailability(
        lawyerId,
        date as string
      );
      
      return res.status(200).json({
        success: true,
        data: availability
      });
    } catch (error) {
      console.error('Error fetching availability:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch availability'
      });
    }
  }

  // Set lawyer availability
  async setLawyerAvailability(req: Request, res: Response) {
    try {
      const lawyerId = req.user?.id;
      const availabilityData = req.body;
      
      const availability = await appointmentService.setLawyerAvailability(
        lawyerId as string,
        availabilityData
      );
      
      return res.status(200).json({
        success: true,
        message: 'Availability updated successfully',
        data: availability
      });
    } catch (error) {
      console.error('Error setting availability:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update availability'
      });
    }
  }

  // Get pending appointment notifications for lawyer
  async getAppointmentNotifications(req: Request, res: Response) {
    try {
      const lawyerId = req.user?.id;
      
      const notifications = await appointmentService.getPendingAppointments(
        lawyerId as string
      );
      
      return res.status(200).json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Error fetching appointment notifications:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications'
      });
    }
  }

  // Get appointment details
  async getAppointment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const appointment = await appointmentService.getAppointmentById(id);
      
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: appointment
      });
    } catch (error) {
      console.error('Error fetching appointment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch appointment'
      });
    }
  }

  // Get notifications
  async getNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { unreadOnly } = req.query;
      
      const notifications = await notificationService.getNotifications(
        userId as string,
        unreadOnly === 'true'
      );
      
      return res.status(200).json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications'
      });
    }
  }

  // Mark notification as read
  async markNotificationAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      await notificationService.markAsRead(id, userId as string);
      
      return res.status(200).json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read'
      });
    }
  }

  // Get lawyer dashboard statistics
  async getLawyerStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      // Get lawyer ID from user ID
      const lawyer = await prisma.lawyer.findUnique({
        where: { userId: userId }
      });

      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer profile not found'
        });
      }

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      // Get current month stats
      const totalAppointments = await prisma.appointment.count({
        where: { lawyerId: lawyer.id }
      });

      const pendingAppointments = await prisma.appointment.count({
        where: { 
          lawyerId: lawyer.id,
          status: 'PENDING' 
        }
      });

      const completedAppointments = await prisma.appointment.count({
        where: { 
          lawyerId: lawyer.id,
          status: 'COMPLETED' 
        }
      });

      // Get last month stats for comparison
      const lastMonthTotal = await prisma.appointment.count({
        where: { 
          lawyerId: lawyer.id,
          createdAt: { lt: lastMonth }
        }
      });

      const lastMonthCompleted = await prisma.appointment.count({
        where: { 
          lawyerId: lawyer.id,
          status: 'COMPLETED',
          updatedAt: { lt: lastMonth }
        }
      });

      // Calculate changes
      const totalChange = totalAppointments - lastMonthTotal;
      const completedChange = completedAppointments - lastMonthCompleted;

      return res.status(200).json({
        success: true,
        data: {
          total: totalAppointments,
          pending: pendingAppointments,
          completed: completedAppointments,
          totalChange: totalChange >= 0 ? `+${totalChange}` : `${totalChange}`,
          pendingChange: `+0`, // You can implement this logic
          completedChange: completedChange >= 0 ? `+${completedChange}` : `${completedChange}`
        }
      });
    } catch (error) {
      console.error('Error fetching lawyer stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics'
      });
    }
  }

  // Get lawyer recent activities
  async getLawyerRecentActivities(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      // Get lawyer ID from user ID
      const lawyer = await prisma.lawyer.findUnique({
        where: { userId: userId }
      });

      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer profile not found'
        });
      }

      // Get recent appointments (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentAppointments = await prisma.appointment.findMany({
        where: {
          lawyerId: lawyer.id,
          createdAt: { gte: sevenDaysAgo }
        },
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 3
      });

      // Get recently completed appointments
      const completedAppointments = await prisma.appointment.findMany({
        where: {
          lawyerId: lawyer.id,
          status: 'COMPLETED',
          updatedAt: { gte: sevenDaysAgo }
        },
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 3
      });

      return res.status(200).json({
        success: true,
        data: {
          recentAppointments,
          completedAppointments
        }
      });
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch recent activities'
      });
    }
  }
}
