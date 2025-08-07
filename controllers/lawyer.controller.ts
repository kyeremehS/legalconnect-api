import { Request, Response } from 'express';
import { LawyerService } from '../services/lawyer.service';

const lawyerService = new LawyerService();

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

    async updateLawyer(req: Request, res: Response) {
        // Data is already validated by middleware
        return await lawyerService.updateLawyer(req, res);
    }

    async deleteLawyer(req: Request, res: Response) {
        return await lawyerService.deleteLawyer(req, res);
    }
}
