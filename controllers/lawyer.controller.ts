import { Request, Response } from 'express';
import { LawyerService } from '../services/lawyer.service';
import { LawyerVerificationService } from '../services/lawyer-verification.service';
import { verifyLawyerCertificate } from '../services/certificate.service';
import { LawyerRepository } from '../repositories/lawyer.repository';
import { UserRepository } from '../repositories/user.repository';
import { VideoInteractionService } from '../services/video-interaction.service';
import prisma from '../prisma/prismaClient';

const lawyerService = new LawyerService();
const verificationService = new LawyerVerificationService();
const lawyerRepository = new LawyerRepository();
const videoInteractionService = new VideoInteractionService();
const userRepository = new UserRepository();

export class LawyerController {
    async getAllLawyers(req: Request, res: Response) {
        return await lawyerService.getAllLawyers(req, res);
    }

    async getLawyerById(req: Request, res: Response) {
        return await lawyerService.getLawyerById(req, res);
    }

    async getLawyerByUserId(req: Request, res: Response) {
        return await lawyerService.getLawyerByUserId(req, res);
    }

    async searchByPracticeAreas(req: Request, res: Response) {
        return await lawyerService.searchLawyersByPracticeAreas(req, res);
    }

    async searchByLocation(req: Request, res: Response) {
        return await lawyerService.searchLawyersByLocation(req, res);
    }

    async createLawyer(req: Request, res: Response) {
        // Data is already validated by middleware
        return await lawyerService.createLawyer(req, res);
    }

    async registerLawyer(req: Request, res: Response) {
        // Complete lawyer registration (user + lawyer profile)
        return await lawyerService.registerLawyer(req, res);
    }

    async updateLawyer(req: Request, res: Response) {
        // Data is already validated by middleware
        return await lawyerService.updateLawyer(req, res);
    }

    async deleteLawyer(req: Request, res: Response) {
        return await lawyerService.deleteLawyer(req, res);
    }

    // New verification methods
    async getVerificationStatus(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            // Get lawyer profile
            const lawyer = await lawyerRepository.findByUserId(userId);
            if (!lawyer) {
                return res.status(404).json({ error: 'Lawyer profile not found' });
            }

            const verification = await verificationService.getVerificationByLawyerId(lawyer.id);
            
            res.json({
                success: true,
                data: {
                    verificationStatus: lawyer.verificationStatus,
                    isVerified: lawyer.isVerified,
                    verification
                }
            });
        } catch (error) {
            console.error('Error getting verification status:', error);
            res.status(500).json({ error: 'Failed to get verification status' });
        }
    }

    async verifyCertificate(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const { certificateNumber, nameOfLawyer } = req.body;
            
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            if (!certificateNumber) {
                return res.status(400).json({ error: 'Certificate number is required' });
            }

            const lawyer = await lawyerRepository.findByUserId(userId);
            if (!lawyer) {
                return res.status(404).json({ error: 'Lawyer profile not found' });
            }

            // Get user details for name verification
            const user = await userRepository.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const certificateVerification = await verifyLawyerCertificate({
                certificateNumber,
                nameOfLawyer: nameOfLawyer || `${user.firstName} ${user.lastName}`
            });

            // Update lawyer and verification records if verified
            if (certificateVerification.verified) {
                await lawyerRepository.update(lawyer.id, {
                    certificateNumber,
                    certificateVerified: true,
                    certificateVerifiedAt: new Date()
                });

                // Update verification record
                let verification = await verificationService.getVerificationByLawyerId(lawyer.id);
                if (!verification) {
                    // Create verification record if it doesn't exist
                    verification = await verificationService.createVerification({
                        lawyerId: lawyer.id,
                        certificateVerified: true,
                        certificateNumber,
                        certificateName: certificateVerification.certificate?.nameOfLawyer,
                        certificateIssueDate: certificateVerification.certificate?.dateOfIssue,
                        certificateMatchScore: certificateVerification.matchScore
                    });
                } else {
                    await verificationService.updateCertificateVerification(lawyer.id, {
                        certificateVerified: true,
                        certificateNumber,
                        certificateName: certificateVerification.certificate?.nameOfLawyer,
                        certificateIssueDate: certificateVerification.certificate?.dateOfIssue,
                        certificateMatchScore: certificateVerification.matchScore
                    });
                }
            }

            res.json({
                success: true,
                data: certificateVerification
            });
        } catch (error) {
            console.error('Error verifying certificate:', error);
            res.status(500).json({ error: 'Failed to verify certificate' });
        }
    }

    async resubmitVerification(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const { notes } = req.body;
            
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const lawyer = await lawyerRepository.findByUserId(userId);
            if (!lawyer) {
                return res.status(404).json({ error: 'Lawyer profile not found' });
            }

            const verification = await verificationService.resubmitVerification(lawyer.id, notes);
            
            res.json({
                success: true,
                message: 'Verification resubmitted successfully',
                data: verification
            });
        } catch (error) {
            console.error('Error resubmitting verification:', error);
            res.status(500).json({ error: 'Failed to resubmit verification' });
        }
    }

    async getAllLawyerVideos(req: Request, res: Response) {
        try {
            // Get all videos from the videos table with lawyer information
            const videos = await prisma.video.findMany({
                include: {
                    lawyer: {
                        include: {
                            user: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            
            // Transform videos with lawyer information and get real interaction stats
            const videosWithStats = await Promise.all(
                videos.map(async (video) => {
                    // Get real interaction stats for this video using the proper video ID
                    const stats = await videoInteractionService.getVideoStats(video.id);

                    return {
                        id: video.id, // Use the actual video database ID
                        title: video.title,
                        description: video.description,
                        url: video.url,
                        category: video.category,
                        language: video.language,
                        tags: video.tags,
                        lawyer: {
                            id: video.lawyer.id,
                            name: video.lawyer.user?.fullName || `${video.lawyer.user?.firstName} ${video.lawyer.user?.lastName}`,
                            firm: video.lawyer.firm,
                            practiceAreas: video.lawyer.practiceAreas
                        },
                        // Use real interaction counts
                        views: stats.viewCount,
                        likes: stats.likeCount,
                        comments: stats.commentCount,
                        duration: video.duration || "3:45", // Use actual duration or default
                        uploadedAt: video.createdAt
                    };
                })
            );

            res.json({
                success: true,
                data: videosWithStats
            });
        } catch (error) {
            console.error('Error fetching lawyer videos:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch videos' 
            });
        }
    }

    async getLawyerVideos(req: Request, res: Response) {
        try {
            const { id } = req.params;
            
            // Get specific lawyer with videos
            const lawyer = await lawyerRepository.findByIdWithUser(id);
            
            if (!lawyer) {
                return res.status(404).json({
                    success: false,
                    message: 'Lawyer not found'
                });
            }

            // Format videos with real like counts
            const videosWithStats = await Promise.all(
                lawyer.videoUrl?.map(async (videoUrl: string) => {
                    // Get real like count for this video
                    const stats = await videoInteractionService.getVideoStats(
                        lawyer.id,
                        videoUrl
                    );

                    return {
                        id: `${lawyer.id}_${videoUrl}`,
                        url: videoUrl,
                        lawyer: {
                            id: lawyer.id,
                            name: (lawyer as any).user?.fullName || `${(lawyer as any).user?.firstName} ${(lawyer as any).user?.lastName}`,
                            firm: lawyer.firm,
                            practiceAreas: lawyer.practiceAreas
                        },
                        // Use real view count and like count separately
                        views: stats.viewCount,
                        likes: stats.likeCount,
                        comments: stats.commentCount,
                        duration: "3:45",
                        uploadedAt: new Date()
                    };
                }) || []
            );

            res.json({
                success: true,
                data: videosWithStats
            });
        } catch (error) {
            console.error('Error fetching lawyer videos:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch videos' 
            });
        }
    }
}
