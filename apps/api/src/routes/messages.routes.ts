import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as messagesController from '../controllers/messages.controller.js';

const router = Router();
router.use(authenticate);

router.get('/conversations', messagesController.listConversations);
router.get('/conversations/:userId', messagesController.getThread);
router.post('/conversations/:userId', messagesController.sendDm);
router.delete('/:id', messagesController.deleteMessage);

export default router;
