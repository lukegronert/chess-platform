import { Router } from 'express';
import * as messagesController from '../controllers/messages.controller.js';

const router = Router({ mergeParams: true });

router.get('/', messagesController.getBoardMessages);
router.post('/', messagesController.postToBoard);

export default router;
