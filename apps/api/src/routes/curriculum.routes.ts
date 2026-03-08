import { Router } from 'express';
import { requireRole } from '../middleware/auth.js';
import * as curriculumController from '../controllers/curriculum.controller.js';
import { Role } from '@chess/shared';

const router = Router({ mergeParams: true });

router.get('/', curriculumController.listItems);
router.post('/', requireRole(Role.TEACHER, Role.ADMIN), curriculumController.createItem);
router.post('/reorder', requireRole(Role.TEACHER, Role.ADMIN), curriculumController.reorderItems);
router.patch('/:itemId', requireRole(Role.TEACHER, Role.ADMIN), curriculumController.updateItem);
router.delete('/:itemId', requireRole(Role.TEACHER, Role.ADMIN), curriculumController.deleteItem);

export default router;
