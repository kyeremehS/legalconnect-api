import { Request, Response } from 'express';
import { UserRepository, CreateUserData, UpdateUserData } from '../repositories/user.repository';
import { RegisterUserInput, UpdateUserInput } from '../Dto';
import { comparePassword, hashPassword } from '../utils/bcrypt';
import z from 'zod';
import { loginDto } from '../Dto/UserDto';
import { acessToken } from '../utils/jwt';

export class UserService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    async registerUser(req: Request, res: Response) {
        try {
            // Data is already validated by middleware
            const data: RegisterUserInput = req.body;

            // Check if user already exists
            const existingUser = await this.userRepository.findByEmail(data.email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            const hashedPassword = await hashPassword(data.password);

            // Prepare user data (password hashing handled by caller)
            const userData: CreateUserData = {
                firstName: data.firstName,
                lastName: data.lastName,
                username: data.username,
                password: hashedPassword,
                email: data.email,
                role: data.role,
                fullName: `${data.firstName} ${data.lastName}`.trim()
            };

            // Create new user
            const newUser = await this.userRepository.create(userData);

            // Remove sensitive data from response
            const { ...userResponse } = newUser;

            return res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: userResponse
            });

        } catch (error) {
            console.error('Error registering user:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    async getUserById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const user = await this.userRepository.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: user
            });

        } catch (error) {
            console.error('Error fetching user:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    async updateUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            // Data is already validated by middleware
            const updateData: UpdateUserInput = req.body;

            const updatedUser = await this.userRepository.update(id, updateData as UpdateUserData);

            return res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: updatedUser
            });

        } catch (error) {
            console.error('Error updating user:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    async getAllUsers(req: Request, res: Response) {
        try {
            const users = await this.userRepository.findAll();

            return res.status(200).json({
                success: true,
                data: users
            });

        } catch (error) {
            console.error('Error fetching users:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    async deleteUser(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const deletedUser = await this.userRepository.delete(id);

            return res.status(200).json({
                success: true,
                message: 'User deleted successfully',
                data: deletedUser
            });

        } catch (error) {
            console.error('Error deleting user:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    async loginUser(req: Request, res:Response, data:z.infer<typeof loginDto>){
        try{
            const user = await this.userRepository.findByEmail(data.email);
            if(!user){
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            const passwordMatch = await comparePassword(data.password, user.password as string);
            if(!passwordMatch){

                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            const { password, ...userResponse } = user;
            const token = await acessToken({id: user.id as string, email: user.email as string, role: user.role as string});

            return res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: userResponse,
                    token
                }
            });
        } catch (error) {
            console.error('Error logging in user:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }

    }
}