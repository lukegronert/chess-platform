import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as contentController from '../controllers/content.controller.js';
import { Role } from '@chess/shared';

const router = Router();
router.use(authenticate);

// PDFs
router.get('/pdfs', contentController.listPdfs);
router.post('/pdfs/upload-url', requireRole(Role.TEACHER, Role.ADMIN), contentController.getUploadUrl);
router.post('/pdfs', requireRole(Role.TEACHER, Role.ADMIN), contentController.createPdf);
router.get('/pdfs/:id', contentController.getPdf);
router.get('/pdfs/:id/view-url', contentController.getViewUrl);
router.delete('/pdfs/:id', requireRole(Role.TEACHER, Role.ADMIN), contentController.deletePdf);

// Assignments
router.get('/assignments', contentController.listAssignments);
router.post('/assignments', requireRole(Role.TEACHER, Role.ADMIN), contentController.createAssignment);
router.patch('/assignments/:id', contentController.updateAssignment);
router.delete('/assignments/:id', requireRole(Role.TEACHER, Role.ADMIN), contentController.deleteAssignment);

export default router;
