import { Router } from "express";
import { MessageController } from "../controllers/message.controller";

const router = Router();
const messageController = new MessageController();

router.post("/", (req, res) => messageController.send(req, res));
router.get("/:senderId/:receiverId", (req, res) => messageController.getConversation(req, res));

export default router;
