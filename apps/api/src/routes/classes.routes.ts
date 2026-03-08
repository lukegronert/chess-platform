import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as classesController from '../controllers/classes.controller.js';
import { Role } from '@chess/shared';
import curriculumRoutes from './curriculum.routes.js';
import boardRoutes from './board.routes.js';

const router = Router();
router.use(authenticate);

router.get('/', classesController.listClasses);
router.post('/', requireRole(Role.ADMIN), classesController.createClass);
router.get('/:id', classesController.getClass);
router.patch('/:id', requireRole(Role.ADMIN, Role.TEACHER), classesController.updateClass);
router.delete('/:id', requireRole(Role.ADMIN), classesController.deleteClass);

// Enrollments
router.get('/:id/enrollments', classesController.listEnrollments);
router.post('/:id/enrollments', requireRole(Role.ADMIN, Role.TEACHER), classesController.enrollStudent);
router.delete('/:id/enrollments/:studentId', requireRole(Role.ADMIN, Role.TEACHER), classesController.unenrollStudent);

// Groups
router.get('/:id/groups', classesController.listGroups);
router.post('/:id/groups', requireRole(Role.TEACHER, Role.ADMIN), classesController.createGroup);
router.patch('/:id/groups/:groupId', requireRole(Role.TEACHER, Role.ADMIN), classesController.updateGroup);
router.delete('/:id/groups/:groupId', requireRole(Role.TEACHER, Role.ADMIN), classesController.deleteGroup);
router.post('/:id/groups/:groupId/members', requireRole(Role.TEACHER, Role.ADMIN), classesController.addGroupMember);
router.delete('/:id/groups/:groupId/members/:userId', requireRole(Role.TEACHER, Role.ADMIN), classesController.removeGroupMember);

// Sub-routers
router.use('/:id/curriculum', curriculumRoutes);
router.use('/:id/board', boardRoutes);

export default router;
