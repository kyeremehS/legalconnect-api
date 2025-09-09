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
}
