import { Request, Response } from 'express';
import { LawyerRepository } from '../repositories/lawyer.repository';
import { UserRepository, CreateUserData } from '../repositories/user.repository';
import { hashPassword } from '../utils/bcrypt';

export class LawyerService {
    private lawyerRepository: LawyerRepository;
    private userRepository: UserRepository;

    constructor() {
        this.lawyerRepository = new LawyerRepository();
        this.userRepository = new UserRepository();
    }

    async getAllLawyers(req: Request, res: Response) {
        try {
            const lawyers = await this.lawyerRepository.findAll();

            return res.status(200).json({
                success: true,
                message: 'Lawyers retrieved successfully',
                data: lawyers,
                count: lawyers.length
            });

        } catch (error) {
            console.error('Error fetching lawyers:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    async getLawyerById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const lawyer = await this.lawyerRepository.findById(id);
            if (!lawyer) {
                return res.status(404).json({
                    success: false,
                    message: 'Lawyer not found'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Lawyer retrieved successfully',
                data: lawyer
            });

        } catch (error) {
            console.error('Error fetching lawyer:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    async getLawyerByUserId(req: Request, res: Response) {
        try {
            const { userId } = req.params;

            const lawyer = await this.lawyerRepository.findByUserId(userId);
            if (!lawyer) {
                return res.status(404).json({
                    success: false,
                    message: 'Lawyer profile not found for this user'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Lawyer profile retrieved successfully',
                data: lawyer
            });

        } catch (error) {
            console.error('Error fetching lawyer by user ID:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    async searchLawyersByPracticeAreas(req: Request, res: Response) {
        try {
            const { practiceAreas } = req.query;

            if (!practiceAreas) {
                return res.status(400).json({
                    success: false,
                    message: 'Practice areas are required for search'
                });
            }

            // Convert comma-separated string to array
            const practiceAreaArray = typeof practiceAreas === 'string' 
                ? practiceAreas.split(',').map(area => area.trim()) 
                : [];

            const lawyers = await this.lawyerRepository.findByPracticeAreas(practiceAreaArray);

            return res.status(200).json({
                success: true,
                message: 'Lawyers retrieved successfully',
                data: lawyers,
                count: lawyers.length,
                searchCriteria: { practiceAreas: practiceAreaArray }
            });

        } catch (error) {
            console.error('Error searching lawyers by practice areas:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    async searchLawyersByLocation(req: Request, res: Response) {
        try {
            const { location } = req.query;

            if (!location || typeof location !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Location is required for search'
                });
            }

            const lawyers = await this.lawyerRepository.findByLocation(location);

            return res.status(200).json({
                success: true,
                message: 'Lawyers retrieved successfully',
                data: lawyers,
                count: lawyers.length,
                searchCriteria: { location }
            });

        } catch (error) {
            console.error('Error searching lawyers by location:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    async createLawyer(req: Request, res: Response) {
        try {
            // Data should be validated by middleware before reaching here
            const lawyerData = req.body;

            const newLawyer = await this.lawyerRepository.create(lawyerData);

            return res.status(201).json({
                success: true,
                message: 'Lawyer profile created successfully',
                data: newLawyer
            });

        } catch (error) {
            console.error('Error creating lawyer:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    async registerLawyer(req: Request, res: Response) {
        try {
            const {
                // User data
                firstName,
                lastName,
                email,
                password,
                // Lawyer specific data
                firm,
                location,
                barAdmissionYear,
                experience,
                practiceAreas,
                education,
                barAssociation,
                specializations,
                languages,
                professionalSummary
            } = req.body;

            // Check if user already exists
            const existingUser = await this.userRepository.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            // Hash password
            const hashedPassword = await hashPassword(password);

            // Create user with LAWYER role
            const userData: CreateUserData = {
                firstName,
                lastName,
                username: email, // Using email as username
                password: hashedPassword,
                email,
                role: 'LAWYER',
                fullName: `${firstName} ${lastName}`.trim()
            };

            const newUser = await this.userRepository.create(userData);

            // Create lawyer profile
            const lawyerData = {
                userId: newUser.id,
                firm,
                location,
                barAdmissionYear,
                experience: parseInt(experience) || 0,
                practiceAreas: Array.isArray(practiceAreas) ? practiceAreas : practiceAreas?.split(',').map((area: string) => area.trim()) || [],
                education,
                barAssociation,
                specializations: Array.isArray(specializations) ? specializations : specializations?.split(',').map((spec: string) => spec.trim()) || [],
                languages: Array.isArray(languages) ? languages : languages?.split(',').map((lang: string) => lang.trim()) || [],
                professionalSummary
            };

            const newLawyer = await this.lawyerRepository.create(lawyerData);

            // Remove sensitive data from response
            const { password: _, ...userResponse } = newUser;

            return res.status(201).json({
                success: true,
                message: 'Lawyer registered successfully',
                data: {
                    user: userResponse,
                    lawyer: newLawyer
                }
            });

        } catch (error) {
            console.error('Error registering lawyer:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    async updateLawyer(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const updatedLawyer = await this.lawyerRepository.update(id, updateData);

            return res.status(200).json({
                success: true,
                message: 'Lawyer profile updated successfully',
                data: updatedLawyer
            });

        } catch (error) {
            console.error('Error updating lawyer:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    async deleteLawyer(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await this.lawyerRepository.delete(id);

            return res.status(200).json({
                success: true,
                message: 'Lawyer profile deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting lawyer:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
