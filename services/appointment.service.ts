import { AppointmentRepository } from '../repositories/appointment.repository';
import { NotificationService } from './notification.service';

export class AppointmentService {
  private appointmentRepo = new AppointmentRepository();
  private notificationService = new NotificationService();

  async createAppointment(appointmentData: any) {
    // Transform and validate the appointment data
    const transformedData = {
      clientId: appointmentData.clientId,
      lawyerId: appointmentData.lawyerId,
      title: appointmentData.title,
      description: appointmentData.description || '',
      startTime: new Date(appointmentData.startTime),
      endTime: new Date(appointmentData.endTime),
      meetingType: appointmentData.meetingType || 'VIRTUAL',
      practiceArea: appointmentData.practiceArea,
      duration: appointmentData.duration
    };

    // Validate time slot availability
    const isAvailable = await this.appointmentRepo.checkTimeSlotAvailability(
      transformedData.lawyerId,
      transformedData.startTime.toISOString(),
      transformedData.endTime.toISOString()
    );

    if (!isAvailable) {
      throw new Error('Time slot is not available');
    }

    // Create appointment
    const appointment = await this.appointmentRepo.create(transformedData);

    // Send notification to lawyer
    await this.notificationService.createNotification({
      userId: transformedData.lawyerId,
      title: 'New Appointment Request',
      message: `You have a new appointment request from ${appointment.client.firstName} ${appointment.client.lastName} for ${transformedData.startTime.toLocaleDateString()}`,
      type: 'APPOINTMENT_REQUEST',
      data: { appointmentId: appointment.id }
    });

    return appointment;
  }

  async updateAppointmentStatus(appointmentId: string, status: string, lawyerId: string, notes?: string) {
    // Verify lawyer owns this appointment
    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment || appointment.lawyerId !== lawyerId) {
      throw new Error('Appointment not found or access denied');
    }

    // Update appointment
    const updatedAppointment = await this.appointmentRepo.update(appointmentId, {
      status,
      notes
    });

    // Send notification to client
    const notificationMessage = status === 'CONFIRMED' 
      ? 'Your appointment has been confirmed'
      : status === 'CANCELLED'
      ? 'Your appointment has been cancelled'
      : 'Your appointment status has been updated';

    await this.notificationService.createNotification({
      userId: appointment.clientId,
      title: 'Appointment Update',
      message: notificationMessage,
      type: status === 'CONFIRMED' ? 'APPOINTMENT_CONFIRMED' : 'APPOINTMENT_CANCELLED',
      data: { appointmentId: appointment.id }
    });

    return updatedAppointment;
  }

  async getLawyerAppointments(lawyerId: string, filters: any) {
    return await this.appointmentRepo.findByLawyer(lawyerId, filters);
  }

  async getClientAppointments(clientId: string, filters: any) {
    return await this.appointmentRepo.findByClient(clientId, filters);
  }

  async getLawyerAvailability(lawyerId: string, date?: string) {
    return await this.appointmentRepo.getLawyerAvailability(lawyerId, date);
  }

  async setLawyerAvailability(lawyerId: string, availabilityData: any[]) {
    return await this.appointmentRepo.setLawyerAvailability(lawyerId, availabilityData);
  }

  async getPendingAppointments(lawyerId: string) {
    const appointments = await this.appointmentRepo.getPendingAppointments(lawyerId);
    
    // Transform for notification popup
    return appointments.map(appointment => ({
      id: `notif_${appointment.id}`,
      appointmentId: appointment.id,
      clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
      clientEmail: appointment.client.email,
      requestedTime: appointment.startTime.toISOString(),
      duration: appointment.duration || '60 minutes',
      message: appointment.description,
      practiceArea: appointment.practiceArea || 'General Consultation'
    }));
  }

  async getAppointmentById(appointmentId: string) {
    return await this.appointmentRepo.findById(appointmentId);
  }
}
