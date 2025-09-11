import { MessageRepository } from "../repositories/message.repository";

export class MessageService {
    private messageRepo = new MessageRepository();

    async sendMessage(senderId: string, receiverId: string, senderRole: string, content: string) {
        return this.messageRepo.createMessage(senderId, receiverId, senderRole, content);
    }

    async fetchConversation(senderId: string, receiverId: string) {
        return this.messageRepo.getConversation(senderId, receiverId);
    }

    async getUserConversations(userId: string) {
        return this.messageRepo.getUserConversations(userId);
    }

    async getLawyerMessageCalls(lawyerId: string) {
        return this.messageRepo.getLawyerMessageCalls(lawyerId);
    }

    async sendCallRequest(senderId: string, lawyerId: string, senderRole: string, content: string, requestType: string) {
        return this.messageRepo.createCallRequest(senderId, lawyerId, senderRole, content, requestType);
    }

    async getRecentMessages(userId: string) {
        return this.messageRepo.getRecentMessages(userId);
    }
}
