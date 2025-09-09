import prisma from '../prisma/prismaClient';
import { User, UserRole, UserStatus } from '@prisma/client';
import { RegisterUserInput, UpdateUserInput } from '../Dto';

// Extend the DTO types for repository operations
export interface CreateUserData extends Omit<RegisterUserInput, 'role'> {
    password: string; // Optional since you'll handle hashing
    fullName: string;
    role: UserRole;
    status?: UserStatus;
}

export interface UpdateUserData extends Omit<UpdateUserInput, 'role'> {
    fullName?: string;
    role?: UserRole;
}

export class UserRepository {
    async findByEmail(email: string): Promise<Partial<User> | null> {
        const user = await prisma.user.findUnique({
            where: { email },
            select:{
                id: true,
                firstName: true,
                lastName: true,
                fullName: true,
                email: true,
                password: true,
                phone: true,
                role: true,
                status: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true

            }
        });

        return user;
    }

    async findById(id: string): Promise<User | null> {
        return await prisma.user.findUnique({
            where: { id }
        });
    }

    async create(userData: CreateUserData): Promise<User> {
        return await prisma.user.create({
            data: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                fullName: userData.fullName || `${userData.firstName} ${userData.lastName}`,
                username: userData.username,
                email: userData.email,
                password: userData.password,
                role: userData.role || 'CLIENT',
                status: userData.status || 'ACTIVE'
            }
        });
    }

    async update(id: string, userData: UpdateUserData): Promise<User> {
        return await prisma.user.update({
            where: { id },
            data: {
                ...userData,
                // Ensure role is compatible with Prisma's UserRole enum
                ...(userData.role && { role: userData.role as UserRole })
            }
        });
    }

    async delete(id: string): Promise<User> {
        return await prisma.user.delete({
            where: { id }
        });
    }

    async findAll(): Promise<Partial<User>[]> {
        return await prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true
            }
        });
    }
}
