import prisma from "../prisma/prismaClient";

export class MessageRepository {
    async createMessage(senderId: string, receiverId: string, senderRole: string, content: string) {
        return prisma.message.create({
            data: { senderId, receiverId, senderRole, content },
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
}
