import { MessageRepository } from "../repositories/message.repository";

export class MessageService {
    private messageRepo = new MessageRepository();

    async sendMessage(senderId: number, receiverId: number, senderRole: string, content: string) {
        return this.messageRepo.createMessage(senderId, receiverId, senderRole, content);
    }

    async fetchConversation(senderId: number, receiverId: number) {
        return this.messageRepo.getConversation(senderId, receiverId);
    }
}
