import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as announcementsController from '../controllers/announcements.controller.js';
import { Role } from '@chess/shared';

const router = Router();
router.use(authenticate);

router.get('/', announcementsController.listAnnouncements);
router.post('/', requireRole(Role.ADMIN, Role.TEACHER), announcementsController.createAnnouncement);
router.patch('/:id', requireRole(Role.ADMIN, Role.TEACHER), announcementsController.updateAnnouncement);
router.delete('/:id', requireRole(Role.ADMIN, Role.TEACHER), announcementsController.deleteAnnouncement);

export default router;
