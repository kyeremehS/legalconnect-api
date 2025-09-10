import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AvailabilityService {
  // Create availability slots for a lawyer
  async createAvailability(
    lawyerId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    date?: string
  ) {
    return prisma.lawyerAvailability.create({
      data: {
        lawyerId,
        dayOfWeek,
        startTime,
        endTime,
        date: date ? new Date(date) : null,
        isAvailable: true,
      },
    });
  }

  // Get lawyer's availability for a specific date range
  async getLawyerAvailability(lawyerId: string, startDate?: string, endDate?: string) {
    const whereClause: any = {
      lawyerId,
      isAvailable: true,
    };

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    return prisma.lawyerAvailability.findMany({
      where: whereClause,
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });
  }

  // Get all available lawyers for a specific date and time
  async getAvailableLawyers(date: string, time: string, practiceArea?: string) {
    const dayOfWeek = new Date(date).getDay(); // Returns 0-6 for Sun-Sat

    const lawyers = await prisma.lawyer.findMany({
      where: {
        isVerified: true,
        isAvailableForBooking: true,
        ...(practiceArea && { practiceAreas: { has: practiceArea } }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        availabilitySlots: {
          where: {
            isAvailable: true,
            OR: [
              {
                // Check recurring availability (no specific date)
                date: null,
                dayOfWeek: dayOfWeek,
                startTime: { lte: time },
                endTime: { gte: time },
              },
              {
                // Check specific date availability
                date: new Date(date),
                startTime: { lte: time },
                endTime: { gte: time },
              },
            ],
          },
        },
        bookedAppointments: {
          where: {
            startTime: {
              gte: new Date(`${date}T00:00:00`),
              lt: new Date(`${date}T23:59:59`),
            },
            status: {
              in: ['SCHEDULED', 'CONFIRMED'],
            },
          },
        },
      },
    });

    // Filter out lawyers who have conflicting appointments
    return lawyers.filter(lawyer => {
      const hasAvailability = lawyer.availabilitySlots.length > 0;
      const hasConflictingAppointment = lawyer.bookedAppointments.some(appointment => {
        const appointmentTime = new Date(appointment.startTime).toTimeString().substring(0, 5);
        const endTime = new Date(appointment.endTime).toTimeString().substring(0, 5);
        return time >= appointmentTime && time < endTime;
      });

      return hasAvailability && !hasConflictingAppointment;
    });
  }

  // Update availability status
  async updateAvailabilityStatus(availabilityId: string, isAvailable: boolean) {
    return prisma.lawyerAvailability.update({
      where: { id: availabilityId },
      data: { isAvailable },
    });
  }

  // Update availability (general update)
  async updateAvailability(availabilityId: string, updateData: any) {
    return prisma.lawyerAvailability.update({
      where: { id: availabilityId },
      data: updateData,
    });
  }

  // Delete availability slot
  async deleteAvailability(availabilityId: string) {
    return prisma.lawyerAvailability.delete({
      where: { id: availabilityId },
    });
  }

  // Get lawyer's upcoming appointments
  async getLawyerAppointments(lawyerId: string, startDate?: string) {
    const whereClause: any = {
      lawyerId,
    };

    if (startDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
      };
    }

    return prisma.appointment.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  // Batch create recurring availability
  async createRecurringAvailability(
    lawyerId: string,
    schedule: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>
  ) {
    const availabilityData = schedule.map(slot => ({
      lawyerId,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: true,
    }));

    return prisma.lawyerAvailability.createMany({
      data: availabilityData,
    });
  }
}
