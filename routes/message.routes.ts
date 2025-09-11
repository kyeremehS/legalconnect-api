import { Router } from "express";
import { MessageController } from "../controllers/message.controller";
import { authenticate } from "../middlewares/Auth.middleware";

const router = Router();
const messageController = new MessageController();

// @route   GET /api/messages/test
// @desc    Test endpoint for message system (no auth required)
// @access  Public
router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Message system is working!",
        timestamp: new Date().toISOString(),
        endpoints: {
            "POST /api/messages": "Send a message (auth required)",
            "GET /api/messages/conversations": "Get user conversations (auth required)",
            "GET /api/messages/lawyer/calls": "Get lawyer message calls (lawyer auth required)",
            "POST /api/messages/call-request": "Send call request (auth required)"
        }
    });
});

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

// @route   GET /api/messages/lawyer/calls
// @desc    Get all active client conversations for lawyers (message-calls page)
// @access  Private (Lawyers only)
router.get("/lawyer/calls", 
    authenticate,
    (req, res) => messageController.getLawyerMessageCalls(req, res)
);

// @route   POST /api/messages/call-request
// @desc    Send a message that creates a call request for a lawyer
// @access  Private (Authenticated users)
router.post("/call-request", 
    authenticate,
    (req, res) => messageController.sendCallRequest(req, res)
);

// @route   POST /api/messages/test/sample-data/:lawyerId
// @desc    Create sample messages for testing (remove in production)
// @access  Private (Authenticated users)
router.post("/test/sample-data/:lawyerId", 
    authenticate,
    async (req, res) => {
        try {
            const { lawyerId } = req.params;
            const userId = req.user?.id;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }

            // Send a regular message
            await messageController.send({
                ...req,
                body: {
                    receiverId: lawyerId,
                    content: "Hello, I need legal assistance with my case."
                }
            } as any, res);

            // Note: This would need to be called separately due to response handling
            res.status(200).json({
                success: true,
                message: "Sample message sent. Send another call request separately.",
                info: "Use POST /api/messages/call-request with lawyerId to create a call request"
            });
        } catch (error) {
            console.error("Error creating sample data:", error);
            res.status(500).json({
                success: false,
                message: "Error creating sample data"
            });
        }
    }
);

// @route   GET /api/messages/recent
// @desc    Get recent messages for dashboard
// @access  Private (Authenticated users)
router.get("/recent", 
    authenticate,
    (req, res) => messageController.getRecentMessages(req, res)
);

export default router;
