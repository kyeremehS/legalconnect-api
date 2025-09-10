import { Router } from "express";
import { MessageController } from "../controllers/message.controller";
import { authenticate } from "../middlewares/Auth.middleware";

const router = Router();
const messageController = new MessageController();

// @route   POST /api/messages
// @desc    Send a message
// @access  Private (Authenticated users)
router.post("/", 
    authenticate,
    (req, res) => messageController.send(req, res)
);

// @route   GET /api/messages/conversations
// @desc    Get all conversations for the authenticated user
// @access  Private (Authenticated users)
router.get("/conversations", 
    authenticate,
    (req, res) => messageController.getUserConversations(req, res)
);

// @route   GET /api/messages/:senderId/:receiverId
// @desc    Get conversation between two users
// @access  Private (Authenticated users)
router.get("/:senderId/:receiverId", 
    authenticate,
    (req, res) => messageController.getConversation(req, res)
);

export default router;
