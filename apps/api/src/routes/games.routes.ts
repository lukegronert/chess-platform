import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { Role } from '@chess/shared';
import * as gamesController from '../controllers/games.controller.js';

const router = Router();
router.use(authenticate);

// Named routes must come before /:id to avoid being caught as an id param
router.get('/admin/all', requireRole(Role.ADMIN), gamesController.listAllGames);
router.get('/teacher/students', requireRole(Role.TEACHER, Role.ADMIN), gamesController.listTeacherStudentGames);

router.get('/', gamesController.listGames);
router.post('/', gamesController.createGame);
router.get('/:id', gamesController.getGame);
router.patch('/:id', gamesController.updateGame);
router.post('/:id/resign', gamesController.resign);
router.get('/:id/moves', gamesController.getMoves);
router.get('/:id/messages', requireRole(Role.ADMIN, Role.TEACHER), gamesController.getGameMessages);

export default router;
