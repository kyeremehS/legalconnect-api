import { prisma } from "../prisma/prismaClient";

export class MessageRepository {
    async createMessage(senderId: number, receiverId: number, senderRole: string, content: string) {
        return prisma.message.create({
            data: { senderId, receiverId, senderRole, content },
        });
    }

    async getConversation(senderId: number, receiverId: number) {
        return prisma.message.findMany({
            where: {
                OR: [
                    { senderId: receiverId, receiverId: receiverId },
                    { senderId: receiverId, receiverId: receiverId },
                ],
            },
            orderBy: { createdAt: 'asc' },
        });
    }
}
