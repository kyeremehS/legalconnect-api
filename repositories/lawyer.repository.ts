import prisma from '../prisma/prismaClient';
import { Lawyer } from '../generated/prisma';

export class LawyerRepository {
    async findAll(): Promise<Lawyer[]> {
        return await prisma.lawyer.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        isActive: true,
                        isVerified: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            }
        });
    }

    async findById(id: string): Promise<Lawyer | null> {
        return await prisma.lawyer.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        isActive: true,
                        isVerified: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            }
        });
    }

    async findByUserId(userId: string): Promise<Lawyer | null> {
        return await prisma.lawyer.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        isActive: true,
                        isVerified: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            }
        });
    }

    async create(lawyerData: {
        userId: string;
        professionalSummary?: string;
        firm: string;
        location?: string;
        barAdmissionYear?: string;
        experience?: number;
        practiceAreas: string[];
        education?: string;
        barAssociation?: string;
        website?: string;
        specializations: string[];
        languages: string[];
    }): Promise<Lawyer> {
        return await prisma.lawyer.create({
            data: lawyerData,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        isActive: true,
                        isVerified: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            }
        });
    }

    async update(id: string, lawyerData: Partial<{
        professionalSummary?: string;
        firm: string;
        location?: string;
        barAdmissionYear?: string;
        experience?: number;
        practiceAreas: string[];
        education?: string;
        barAssociation?: string;
        website?: string;
        specializations: string[];
        languages: string[];
        certificateNumber?: string;
        certificateVerified?: boolean;
        certificateVerifiedAt?: Date;
        verificationStatus?: any;
        isVerified?: boolean;
        verifiedAt?: Date;
    }>): Promise<Lawyer> {
        return await prisma.lawyer.update({
            where: { id },
            data: lawyerData,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        isActive: true,
                        isVerified: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            }
        });
    }

    async delete(id: string): Promise<Lawyer> {
        return await prisma.lawyer.delete({
            where: { id }
        });
    }

    // Search lawyers by practice areas
    async findByPracticeAreas(practiceAreas: string[]): Promise<Lawyer[]> {
        return await prisma.lawyer.findMany({
            where: {
                practiceAreas: {
                    hasSome: practiceAreas
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        isActive: true,
                        isVerified: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            }
        });
    }

    // Search lawyers by location
    async findByLocation(location: string): Promise<Lawyer[]> {
        return await prisma.lawyer.findMany({
            where: {
                location: {
                    contains: location,
                    mode: 'insensitive'
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        isActive: true,
                        isVerified: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            }
        });
    }
}
