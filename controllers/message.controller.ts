import { Request, Response } from "express";
import { MessageService } from "../services/message.service";

const messageService = new MessageService();

export class MessageController {
    async send(req: Request, res: Response) {
        const { senderId, receiverId, senderRole, content } = req.body;
        const message = await messageService.sendMessage(senderId, receiverId, senderRole, content);
        res.json(message);
    }

    async getConversation(req: Request, res: Response) {
        const { senderId, receiverId } = req.params;
        const messages = await messageService.fetchConversation(Number(senderId), Number(receiverId));
        res.json(messages);
    }
}
