import prisma from "../prisma/prismaClient";

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
        
        // First, get all unique sender IDs who have sent messages to this lawyer
        const uniqueSenders = await prisma.message.groupBy({
            by: ['senderId'],
            where: {
                receiverId: lawyerId,
                senderRole: 'user' // Only messages from users/clients
            },
        });

        console.log('Found unique senders:', uniqueSenders.length);

        // Then, for each sender, get their latest message and statistics
        const clientMessages = await Promise.all(
            uniqueSenders.map(async ({ senderId }) => {
                // Get the latest message from this client
                const latestMessage = await prisma.message.findFirst({
                    where: {
                        senderId,
                        receiverId: lawyerId,
                    },
                    orderBy: {
                        createdAt: 'desc',
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
                        }
                    },
                });

                // Count different types of messages for this client
                const messageCounts = await prisma.message.groupBy({
                    by: ['messageType'],
                    where: {
                        senderId,
                        receiverId: lawyerId,
                    },
                    _count: {
                        id: true,
                    },
                });

                const callRequestCount = messageCounts.find(
                    (count) => count.messageType === 'call-request'
                )?._count.id || 0;

                const regularMessageCount = messageCounts.find(
                    (count) => count.messageType === 'message'
                )?._count.id || 0;

                // Check if there are any active call requests
                const activeCallRequest = await prisma.message.findFirst({
                    where: {
                        senderId,
                        receiverId: lawyerId,
                        messageType: 'call-request',
                        status: 'active'
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });

                return {
                    clientId: senderId,
                    client: latestMessage?.sender,
                    latestMessage,
                    callRequestCount,
                    regularMessageCount,
                    totalMessages: callRequestCount + regularMessageCount,
                    hasActiveCallRequest: !!activeCallRequest,
                    activeCallRequest
                };
            })
        );

        // Filter out any null results and sort by latest message date
        const result = clientMessages
            .filter((item) => item.latestMessage !== null)
            .sort((a, b) => {
                const dateA = new Date(a.latestMessage!.createdAt);
                const dateB = new Date(b.latestMessage!.createdAt);
                return dateB.getTime() - dateA.getTime();
            });

        console.log('Final client calls result:', result.length);
        
        result.forEach((item, index) => {
            console.log(`Client ${index + 1}:`);
            console.log(`  Client: ${item.client?.firstName} ${item.client?.lastName}`);
            console.log(`  Latest message: "${item.latestMessage?.content?.substring(0, 30)}..."`);
            console.log(`  Call requests: ${item.callRequestCount}, Regular messages: ${item.regularMessageCount}`);
            console.log(`  Has active call request: ${item.hasActiveCallRequest}`);
        });
        
        return result;
    }
}
