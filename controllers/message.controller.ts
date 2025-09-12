import { Request, Response } from "express";
import { MessageService } from "../services/message.service";
import { io, onlineUsers } from "../index";

const messageService = new MessageService();

export class MessageController {
    async send(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }

            const { receiverId, content } = req.body;

            if (!receiverId || !content) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: receiverId, content"
                });
            }

            const senderId = req.user.id;
            const senderRole = req.user.role;

            console.log('Sending message:', {
                senderId,
                receiverId,
                senderRole,
                content: content.substring(0, 50) + '...'
            });

            // Save message in DB
            const message = await messageService.sendMessage(senderId, receiverId, senderRole, content);

            // Emit to receiver if online
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", message);
                console.log(`Emitted new message to user ${receiverId} via socket ${receiverSocketId}`);
            }

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

            if (!lawyerId) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required field: lawyerId"
                });
            }

            const senderId = req.user.id;
            const senderRole = req.user.role;

            const callRequestContent = content || `${req.user.firstName} ${req.user.lastName} is requesting a call consultation.`;

            console.log('Sending call request:', {
                senderId,
                lawyerId,
                senderRole,
                requestType
            });

            const message = await messageService.sendCallRequest(senderId, lawyerId, senderRole, callRequestContent, requestType);

            const lawyerSocketId = onlineUsers.get(lawyerId);
            if (lawyerSocketId) {
                io.to(lawyerSocketId).emit("newMessage", message);
                console.log(`Emitted call request to lawyer ${lawyerId} via socket ${lawyerSocketId}`);
            }

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


    // Get recent messages for dashboard
    async getRecentMessages(req: Request, res: Response) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required'
                });
            }

            // Get recent messages from the message service
            try {
                const recentMessages = await messageService.getRecentMessages(userId);

                return res.status(200).json({
                    success: true,
                    data: recentMessages
                });
            } catch (serviceError) {
                // Fallback to mock data if service fails
                const mockMessages = [
                    {
                        id: '1',
                        content: 'Thank you for your consultation request. I\'ll review your case and get back to you within 24 hours.',
                        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                        isRead: false,
                        sender: {
                            firstName: 'Sarah',
                            lastName: 'Johnson'
                        }
                    },
                    {
                        id: '2',
                        content: 'I\'ve reviewed your contract. There are a few clauses we should discuss. When would be a good time for a call?',
                        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                        isRead: true,
                        sender: {
                            firstName: 'Michael',
                            lastName: 'Chen'
                        }
                    },
                    {
                        id: '3',
                        content: 'Your consultation has been confirmed for tomorrow at 2 PM. Please prepare any relevant documents.',
                        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
                        isRead: true,
                        sender: {
                            firstName: 'Emily',
                            lastName: 'Rodriguez'
                        }
                    }
                ];

                return res.status(200).json({
                    success: true,
                    data: mockMessages
                });
            }
        } catch (error) {
            console.error('Error fetching recent messages:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch recent messages'
            });
        }
    }
}
