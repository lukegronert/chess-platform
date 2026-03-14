import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as usersController from '../controllers/users.controller.js';
import { Role } from '@chess/shared';

const router = Router();

router.use(authenticate);

router.get('/me', usersController.getMe);
router.get('/students', usersController.listStudents);
router.patch('/me', usersController.updateMe);

router.get('/', requireRole(Role.ADMIN), usersController.listUsers);
router.post('/', requireRole(Role.ADMIN), usersController.createUser);
router.get('/:id', requireRole(Role.ADMIN), usersController.getUser);
router.patch('/:id', requireRole(Role.ADMIN), usersController.updateUser);
router.delete('/:id', requireRole(Role.ADMIN), usersController.deleteUser);

export default router;
