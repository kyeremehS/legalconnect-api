import { Request, Response } from 'express';
import { AvailabilityService } from '../services/availability.service';

const availabilityService = new AvailabilityService();

export class AvailabilityController {
  // Create availability slot for a lawyer
  async createAvailability(req: Request, res: Response) {
    try {
      const { lawyerId } = req.params;
      const { dayOfWeek, startTime, endTime, date } = req.body;

      // Validate input
      if (!dayOfWeek || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: 'Day of week, start time, and end time are required',
        });
      }

      // Ensure dayOfWeek is a valid number (0-6)
      const dayNumber = parseInt(dayOfWeek);
      if (isNaN(dayNumber) || dayNumber < 0 || dayNumber > 6) {
        return res.status(400).json({
          success: false,
          message: 'Day of week must be a number between 0 (Sunday) and 6 (Saturday)',
        });
      }

      const availability = await availabilityService.createAvailability(
        lawyerId,
        dayNumber,
        startTime,
        endTime,
        date
      );

      res.status(201).json({
        success: true,
        message: 'Availability created successfully',
        data: availability,
      });
    } catch (error) {
      console.error('Error creating availability:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get lawyer's availability
  async getLawyerAvailability(req: Request, res: Response) {
    try {
      const { lawyerId } = req.params;
      const { startDate, endDate } = req.query;

      const availability = await availabilityService.getLawyerAvailability(
        lawyerId,
        startDate as string,
        endDate as string
      );

      res.json({
        success: true,
        data: availability,
      });
    } catch (error) {
      console.error('Error fetching lawyer availability:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get current lawyer's own availability (using auth token)
  async getMyAvailability(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID not found in token',
        });
      }

      // Get lawyer record from user ID
      const lawyer = await availabilityService.getLawyerByUserId(userId);
      
      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer profile not found',
        });
      }

      const { startDate, endDate } = req.query;

      const availability = await availabilityService.getLawyerAvailability(
        lawyer.id,
        startDate as string,
        endDate as string
      );

      res.json({
        success: true,
        data: availability,
      });
    } catch (error) {
      console.error('Error fetching my availability:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Create availability for current lawyer (using auth token)
  async createMyAvailability(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID not found in token',
        });
      }

      // Get lawyer record from user ID
      const lawyer = await availabilityService.getLawyerByUserId(userId);
      
      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer profile not found',
        });
      }

      const { dayOfWeek, startTime, endTime, date, isRecurring } = req.body;

      if (!startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: 'Start time and end time are required',
        });
      }

      let availability;

      if (isRecurring) {
        // For recurring availability, dayOfWeek is required
        if (dayOfWeek === undefined || dayOfWeek === null) {
          return res.status(400).json({
            success: false,
            message: 'Day of week is required for recurring availability',
          });
        }

        availability = await availabilityService.createAvailability(
          lawyer.id,
          parseInt(dayOfWeek),
          startTime,
          endTime
        );
      } else {
        // For specific date availability, date is required
        if (!date) {
          return res.status(400).json({
            success: false,
            message: 'Date is required for specific availability',
          });
        }

        // Use the day of week from the specific date
        const specificDate = new Date(date);
        const dayOfWeekFromDate = specificDate.getDay();

        availability = await availabilityService.createAvailability(
          lawyer.id,
          dayOfWeekFromDate,
          startTime,
          endTime,
          date
        );
      }

      res.status(201).json({
        success: true,
        message: 'Availability created successfully',
        data: availability,
      });
    } catch (error) {
      console.error('Error creating my availability:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

    // Get all lawyers for testing
  async getAllLawyers(req: Request, res: Response) {
    try {
      const lawyers = await availabilityService.getAllLawyers();
      res.json({
        success: true,
        data: lawyers
      });
    } catch (error) {
      console.error('Error getting lawyers:', error);
      res.status(500).json({ success: false, message: 'Failed to get lawyers' });
    }
  }

  // Temporary method to verify lawyer for testing
  async verifyLawyerForTesting(req: Request, res: Response) {
    try {
      const { lawyerId } = req.params;
      const lawyer = await availabilityService.verifyLawyerForTesting(lawyerId);
      res.json({
        success: true,
        message: `Lawyer ${lawyer.user.firstName} ${lawyer.user.lastName} has been verified for testing`,
        data: lawyer
      });
    } catch (error) {
      console.error('Error verifying lawyer:', error);
      res.status(500).json({ success: false, message: 'Failed to verify lawyer' });
    }
  }

  // Get available lawyers for appointment booking
  async getAvailableLawyers(req: Request, res: Response) {
    try {
      const { date, time, practiceArea } = req.query;

      if (!date || !time) {
        return res.status(400).json({
          success: false,
          message: 'Date and time are required',
        });
      }

      const availableLawyers = await availabilityService.getAvailableLawyers(
        date as string,
        time as string,
        practiceArea as string
      );

      res.json({
        success: true,
        data: availableLawyers,
      });
    } catch (error) {
      console.error('Error fetching available lawyers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get lawyer's appointments
  async getLawyerAppointments(req: Request, res: Response) {
    try {
      const { lawyerId } = req.params;
      const { startDate, endDate } = req.query;

      const appointments = await availabilityService.getLawyerAppointments(
        lawyerId,
        startDate as string
      );

      res.json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      console.error('Error fetching lawyer appointments:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Create recurring availability for a lawyer
  async createRecurringAvailability(req: Request, res: Response) {
    try {
      const { lawyerId } = req.params;
      const { schedule } = req.body;

      if (!schedule || !Array.isArray(schedule)) {
        return res.status(400).json({
          success: false,
          message: 'Schedule array is required',
        });
      }

      // Validate schedule format
      for (const slot of schedule) {
        const dayNumber = parseInt(slot.dayOfWeek);
        if (isNaN(dayNumber) || dayNumber < 0 || dayNumber > 6) {
          return res.status(400).json({
            success: false,
            message: 'Each day of week must be a number between 0 and 6',
          });
        }
        slot.dayOfWeek = dayNumber; // Convert to number
      }

      const result = await availabilityService.createRecurringAvailability(
        lawyerId,
        schedule
      );

      res.status(201).json({
        success: true,
        message: 'Recurring availability created successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error creating recurring availability:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Update availability
  async updateAvailability(req: Request, res: Response) {
    try {
      const { availabilityId } = req.params;
      const updateData = req.body;

      const updatedAvailability = await availabilityService.updateAvailability(
        availabilityId,
        updateData
      );

      res.json({
        success: true,
        message: 'Availability updated successfully',
        data: updatedAvailability,
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Delete availability
  async deleteAvailability(req: Request, res: Response) {
    try {
      const { availabilityId } = req.params;

      await availabilityService.deleteAvailability(availabilityId);

      res.json({
        success: true,
        message: 'Availability deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting availability:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
