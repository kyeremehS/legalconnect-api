import { PrismaClient, AppointmentStatus, MeetingType } from '@prisma/client';

const prisma = new PrismaClient();

export class AppointmentRepository {
  async create(appointmentData: any) {
    return await prisma.appointment.create({
      data: appointmentData,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        lawyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      }
    });
  }

  async findById(id: string) {
    return await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        lawyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      }
    });
  }

  async update(id: string, data: any) {
    return await prisma.appointment.update({
      where: { id },
      data,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        lawyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      }
    });
  }

  async findByLawyer(lawyerId: string, filters: any = {}) {
    const where: any = { lawyerId };
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      
      where.startTime = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    return await prisma.appointment.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });
  }

  async findByClient(clientId: string, filters: any = {}) {
    const where: any = { clientId };
    
    if (filters.status) {
      where.status = filters.status;
    }

    return await prisma.appointment.findMany({
      where,
      include: {
        lawyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });
  }

  async checkTimeSlotAvailability(lawyerId: string, startTime: string, endTime: string) {
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        lawyerId,
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
        },
        OR: [
          {
            startTime: {
              lt: new Date(endTime)
            },
            endTime: {
              gt: new Date(startTime)
            }
          }
        ]
      }
    });

    return conflictingAppointments.length === 0;
  }

  async getLawyerAvailability(lawyerId: string, date?: string) {
    if (date) {
      // Get availability for specific date
      const dayOfWeek = new Date(date).getDay();
      const availability = await prisma.lawyerAvailability.findUnique({
        where: {
          lawyerId_dayOfWeek: {
            lawyerId,
            dayOfWeek
          }
        }
      });

      if (!availability || !availability.isActive) {
        return null;
      }

      // Get booked appointments for this date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const bookedAppointments = await prisma.appointment.findMany({
        where: {
          lawyerId,
          startTime: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: {
            in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
          }
        },
        select: {
          startTime: true,
          endTime: true
        }
      });

      return {
        ...availability,
        bookedSlots: bookedAppointments
      };
    } else {
      // Get all availability
      return await prisma.lawyerAvailability.findMany({
        where: { lawyerId },
        orderBy: { dayOfWeek: 'asc' }
      });
    }
  }

  async setLawyerAvailability(lawyerId: string, availabilityData: any[]) {
    // Delete existing availability
    await prisma.lawyerAvailability.deleteMany({
      where: { lawyerId }
    });

    // Create new availability
    const availability = await prisma.lawyerAvailability.createMany({
      data: availabilityData.map(item => ({
        ...item,
        lawyerId
      }))
    });

    return availability;
  }

  async getPendingAppointments(lawyerId: string) {
    return await prisma.appointment.findMany({
      where: {
        lawyerId,
        status: AppointmentStatus.SCHEDULED
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}
