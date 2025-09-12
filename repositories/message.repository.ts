import prisma from "../prisma/prismaClient";
import { UserRole } from "@prisma/client"; // Adjust the path as needed

export class MessageRepository {
    async createMessage(senderId: string, receiverId: string, senderRole: string, content: string) {
        return prisma.message.create({
            data: { 
                senderId, 
                receiverId, 
                senderRole, 
                content,
                messageType: "message"
            },
        });
    }

    async createCallRequest(senderId: string, receiverId: string, senderRole: string, content: string, requestType: string) {
        return prisma.message.create({
            data: { 
                senderId, 
                receiverId, 
                senderRole, 
                content,
                messageType: requestType,
                status: "active"
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                    }
                }
            }
        });
    }

    async getConversation(senderId: string, receiverId: string) {
        return prisma.message.findMany({
            where: {
                OR: [
                    { senderId: senderId, receiverId: receiverId },
                    { senderId: receiverId, receiverId: senderId },
                ],
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async getUserConversations(userId: string) {
        console.log('Repository getUserConversations called with userId:', userId);
        
        // Get all unique conversations for this user
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId },
                ],
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        console.log('Found messages in repository:', messages.length);
        console.log('First few message details:', messages.slice(0, 2).map(m => ({
            id: m.id,
            senderId: m.senderId,
            receiverId: m.receiverId,
            content: m.content.substring(0, 30) + '...'
        })));

        // Group messages by conversation (unique pairs of users)
        const conversationsMap = new Map();
        
        messages.forEach(message => {
            const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
            const otherUser = message.senderId === userId ? message.receiver : message.sender;
            
            if (!conversationsMap.has(otherUserId)) {
                conversationsMap.set(otherUserId, {
                    participantId: otherUserId,
                    participant: otherUser,
                    lastMessage: message,
                    messages: []
                });
            }
            
            conversationsMap.get(otherUserId).messages.push(message);
        });

        const result = Array.from(conversationsMap.values());
        console.log('Grouped conversations:', result.length);
        
        // Add detailed logging
        result.forEach((conv, index) => {
            console.log(`Conversation ${index + 1}:`);
            console.log(`  Participant ID: ${conv.participantId}`);
            console.log(`  Participant: ${conv.participant?.firstName} ${conv.participant?.lastName}`);
            console.log(`  Messages: ${conv.messages.length}`);
            console.log(`  Last message: "${conv.lastMessage?.content?.substring(0, 30)}..."`);
        });
        
        return result;
    }

async getLawyerMessageCalls(lawyerId: string) {
    console.log('Repository getLawyerMessageCalls called with lawyerId:', lawyerId);

    // Fetch ALL messages where the lawyer is sender or receiver
    const messages = await prisma.message.findMany({
        where: {
            OR: [
                { senderId: lawyerId },
                { receiverId: lawyerId }
            ]
        },
        include: {
            sender: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                }
            },
            receiver: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    console.log(`Found ${messages.length} messages for lawyer`);

    // Group by client (the "other user" that isn't the lawyer)
    const conversationsMap = new Map<string, any>();

    for (const message of messages) {
        const otherUser =
            message.senderId === lawyerId ? message.receiver : message.sender;
        if (!otherUser || otherUser.role !== UserRole.CLIENT) continue; // only clients

        if (!conversationsMap.has(otherUser.id)) {
            conversationsMap.set(otherUser.id, {
                client: otherUser,
                latestMessage: message,
                callRequestCount: 0,
                regularMessageCount: 0,
                totalMessages: 0,
                hasActiveCallRequest: false,
                activeCallRequest: null,
            });
        }

        const convo = conversationsMap.get(otherUser.id);

        // Count messages
        if (message.messageType === "call-request") {
            convo.callRequestCount++;
            if (message.status === "active" && !convo.activeCallRequest) {
                convo.hasActiveCallRequest = true;
                convo.activeCallRequest = message;
            }
        } else if (message.messageType === "message") {
            convo.regularMessageCount++;
        }

        convo.totalMessages++;
    }

    // Convert Map to array
    const result = Array.from(conversationsMap.values()).sort(
        (a, b) =>
            new Date(b.latestMessage.createdAt).getTime() -
            new Date(a.latestMessage.createdAt).getTime()
    );

    console.log("Final grouped conversations:", result.length);
    return result;
}


    async getRecentMessages(userId: string) {
        try {
            // Get recent messages where user is either sender or receiver
            const recentMessages = await prisma.message.findMany({
                where: {
                    OR: [
                        { senderId: userId },
                        { receiverId: userId }
                    ],
                    messageType: "message" // Only regular messages, not call requests
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    },
                    receiver: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 5 // Get 5 most recent messages
            });

            // Transform messages to include sender info and read status
            return recentMessages.map(message => ({
                id: message.id,
                content: message.content,
                createdAt: message.createdAt.toISOString(),
                isRead: true, // Default to true for now
                sender: message.senderId === userId 
                    ? { firstName: 'You', lastName: '' }
                    : {
                        firstName: message.sender.firstName || 'Unknown',
                        lastName: message.sender.lastName || ''
                    }
            }));
        } catch (error) {
            console.error('Error fetching recent messages:', error);
            throw error;
        }
    }
}
