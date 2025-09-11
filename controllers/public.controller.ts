import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PublicController {
  
  // Get platform statistics for landing page
  async getPlatformStats(req: Request, res: Response) {
    try {
      // Get verified lawyers count
      const totalLawyers = await prisma.lawyer.count({
        where: { isVerified: true }
      });

      // Get total clients count (unique users who made appointments)
      const uniqueClients = await prisma.appointment.findMany({
        select: { clientId: true },
        distinct: ['clientId']
      });
      const totalClients = uniqueClients.length;

      // Get total appointments count
      const totalAppointments = await prisma.appointment.count();

      // Calculate average rating (when reviews are implemented)
      const averageRating = 4.8; // Placeholder

      res.json({
        success: true,
        data: {
          totalLawyers,
          totalClients,
          totalAppointments,
          averageRating
        }
      });
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch platform statistics'
      });
    }
  }

  // Get latest videos
  async getLatestVideos(req: Request, res: Response) {
    try {
      // Mock video data - replace with actual video table when implemented
      const mockVideos = [
        {
          id: '1',
          title: 'Understanding Your Rental Rights',
          description: 'Learn about tenant rights, security deposits, and how to handle disputes with landlords.',
          thumbnail: '/video-thumbnails/rental-rights.jpg',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          practiceArea: 'Housing Law',
          duration: '5:30',
          views: 1247
        },
        {
          id: '2',
          title: 'Small Business Contracts 101',
          description: 'Essential guide to creating and understanding business contracts for entrepreneurs.',
          thumbnail: '/video-thumbnails/business-contracts.jpg',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          practiceArea: 'Business Law',
          duration: '8:15',
          views: 892
        },
        {
          id: '3',
          title: 'Family Law Basics',
          description: 'Overview of divorce proceedings, child custody, and family mediation options.',
          thumbnail: '/video-thumbnails/family-law.jpg',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          practiceArea: 'Family Law',
          duration: '6:45',
          views: 1156
        }
      ];

      res.json({
        success: true,
        data: mockVideos
      });
    } catch (error) {
      console.error('Error fetching latest videos:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch latest videos'
      });
    }
  }

  // Get public testimonials
  async getTestimonials(req: Request, res: Response) {
    try {
      // This would fetch from a reviews table when available
      // For now, return empty array so it falls back to static data
      res.json({
        success: true,
        data: []
      });
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch testimonials'
      });
    }
  }

  // Get practice areas with lawyer counts
  async getPracticeAreas(req: Request, res: Response) {
    try {
      const lawyers = await prisma.lawyer.findMany({
        where: { isVerified: true },
        select: { practiceAreas: true }
      });

      // Process the data to get individual practice areas
      const areaMap = new Map<string, number>();

      lawyers.forEach(lawyer => {
        if (lawyer.practiceAreas && Array.isArray(lawyer.practiceAreas)) {
          lawyer.practiceAreas.forEach(area => {
            const current = areaMap.get(area) || 0;
            areaMap.set(area, current + 1);
          });
        }
      });

      const processedAreas: { name: string; lawyerCount: number }[] = [];
      areaMap.forEach((count, name) => {
        processedAreas.push({ name, lawyerCount: count });
      });

      // Sort by lawyer count and take top 6
      const topAreas = processedAreas
        .sort((a, b) => b.lawyerCount - a.lawyerCount)
        .slice(0, 6);

      res.json({
        success: true,
        data: topAreas
      });
    } catch (error) {
      console.error('Error fetching practice areas:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch practice areas'
      });
    }
  }
}
