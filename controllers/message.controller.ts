import { Request, Response } from "express";
import { MessageService } from "../services/message.service";

const messageService = new MessageService();

export class MessageController {
    async send(req: Request, res: Response) {
        try {
            const { senderId, receiverId, senderRole, content } = req.body;
            
            // Validate required fields
            if (!senderId || !receiverId || !senderRole || !content) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: senderId, receiverId, senderRole, content"
                });
            }

            const message = await messageService.sendMessage(senderId, receiverId, senderRole, content);
            
            res.status(201).json({
                success: true,
                message: "Message sent successfully",
                data: message
            });
        } catch (error) {
            console.error("Error sending message:", error);
            res.status(500).json({
                success: false,
                message: "Failed to send message"
            });
        }
    }

    async getConversation(req: Request, res: Response) {
        try {
            const { senderId, receiverId } = req.params;
            
            // Validate required parameters
            if (!senderId || !receiverId) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required parameters: senderId, receiverId"
                });
            }

            const messages = await messageService.fetchConversation(senderId, receiverId);
            
            res.status(200).json({
                success: true,
                message: "Conversation retrieved successfully",
                data: messages
            });
        } catch (error) {
            console.error("Error fetching conversation:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch conversation"
            });
        }
    }
}
