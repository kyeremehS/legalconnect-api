import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

const userService = new UserService();

export class UserController {
    async register(req: Request, res: Response) {
        // Data is already validated by middleware
        return await userService.registerUser(req, res);
    }

    async getUserById(req: Request, res: Response) {
        return await userService.getUserById(req, res);
    }

    async updateUser(req: Request, res: Response) {
        // Data is already validated by middleware
        return await userService.updateUser(req, res);
    }

    async getAllUsers(req: Request, res: Response) {
        return await userService.getAllUsers(req, res);
    }

    async deleteUser(req: Request, res: Response) {
        return await userService.deleteUser(req, res);
    }

    async login(req: Request, res: Response) {
        // Data is already validated by middleware
        const loginData = req.body;
        return await userService.loginUser(req, res, loginData);
    }
}
