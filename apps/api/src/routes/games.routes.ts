import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as gamesController from '../controllers/games.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', gamesController.listGames);
router.post('/', gamesController.createGame);
router.get('/:id', gamesController.getGame);
router.patch('/:id', gamesController.updateGame);
router.post('/:id/resign', gamesController.resign);
router.get('/:id/moves', gamesController.getMoves);

export default router;
