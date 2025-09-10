import { Request, Response } from "express";
import { MessageService } from "../services/message.service";

const messageService = new MessageService();

export class MessageController {
    async send(req: Request, res: Response) {
        try {
            // Get authenticated user from middleware
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }

            const { receiverId, content } = req.body;
            
            // Validate required fields
            if (!receiverId || !content) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: receiverId, content"
                });
            }

            // Use authenticated user's ID and role
            const senderId = req.user.id;
            const senderRole = req.user.role;

            console.log('Sending message:', {
                senderId,
                receiverId,
                senderRole,
                content: content.substring(0, 50) + '...'
            });

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

    async getUserConversations(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }

            const userId = req.user.id;
            console.log('getUserConversations called for user:', userId);
            console.log('User details:', { id: req.user.id, email: req.user.email, role: req.user.role });
            
            const conversations = await messageService.getUserConversations(userId);
            console.log('Found conversations:', conversations.length);
            
            res.status(200).json({
                success: true,
                message: "Conversations retrieved successfully",
                data: conversations
            });
        } catch (error) {
            console.error("Error fetching user conversations:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch conversations"
            });
        }
    }

    async getLawyerMessageCalls(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }

            // Check if user is a lawyer
            if (req.user.role !== 'lawyer') {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Lawyers only."
                });
            }

            const lawyerId = req.user.id;
            console.log('getLawyerMessageCalls called for lawyer:', lawyerId);
            
            const messageCallsData = await messageService.getLawyerMessageCalls(lawyerId);
            console.log('Found message calls data:', messageCallsData.length);

            // Format the response for better frontend consumption
            const formattedData = messageCallsData.map((item) => ({
                client: {
                    id: item.client?.id,
                    firstName: item.client?.firstName,
                    lastName: item.client?.lastName,
                    email: item.client?.email,
                    fullName: `${item.client?.firstName} ${item.client?.lastName}`,
                    role: item.client?.role
                },
                latestMessage: {
                    id: item.latestMessage?.id,
                    content: item.latestMessage?.content,
                    messageType: item.latestMessage?.messageType,
                    status: item.latestMessage?.status,
                    createdAt: item.latestMessage?.createdAt,
                    readAt: item.latestMessage?.readAt
                },
                statistics: {
                    callRequestCount: item.callRequestCount,
                    regularMessageCount: item.regularMessageCount,
                    totalMessages: item.totalMessages,
                    hasActiveCallRequest: item.hasActiveCallRequest
                },
                // Include active call request details if available
                activeCallRequest: item.activeCallRequest ? {
                    id: item.activeCallRequest.id,
                    content: item.activeCallRequest.content,
                    createdAt: item.activeCallRequest.createdAt,
                    status: item.activeCallRequest.status
                } : null
            }));
            
            res.status(200).json({
                success: true,
                message: "Lawyer message calls retrieved successfully",
                data: formattedData,
                count: formattedData.length
            });
        } catch (error) {
            console.error("Error fetching lawyer message calls:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch lawyer message calls"
            });
        }
    }

    async sendCallRequest(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }

            const { lawyerId, content, requestType = 'call-request' } = req.body;
            
            // Validate required fields
            if (!lawyerId) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required field: lawyerId"
                });
            }

            const senderId = req.user.id;
            const senderRole = req.user.role;
            
            // Create a call request message with special content format
            const callRequestContent = content || `${req.user.firstName} ${req.user.lastName} is requesting a call consultation.`;

            console.log('Sending call request:', {
                senderId,
                lawyerId,
                senderRole,
                requestType
            });

            const message = await messageService.sendCallRequest(senderId, lawyerId, senderRole, callRequestContent, requestType);
            
            res.status(201).json({
                success: true,
                message: "Call request sent successfully",
                data: message
            });
        } catch (error) {
            console.error("Error sending call request:", error);
            res.status(500).json({
                success: false,
                message: "Failed to send call request"
            });
        }
    }
}
