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
      const lawyerId = req.user?.id;
      
      const appointment = await appointmentService.updateAppointmentStatus(
        id, 
        status, 
        lawyerId as string,
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
}
