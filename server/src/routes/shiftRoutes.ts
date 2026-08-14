import { Router } from 'express';
import { ShiftRepository } from '../repositories/ShiftRepository';
import { ShiftUserRepository } from '../repositories/ShiftUserRepository';
import { ShiftCapitalContributionRepository } from '../repositories/ShiftCapitalContributionRepository';
import { ShiftService } from '../services/ShiftService';
import { ShiftController } from '../controllers/ShiftController';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

const shiftRepository = new ShiftRepository();
const shiftUserRepository = new ShiftUserRepository();
const capitalRepository = new ShiftCapitalContributionRepository();

const shiftService = new ShiftService(shiftRepository, shiftUserRepository, capitalRepository);
const shiftController = new ShiftController(shiftService);

// Authenticated Routes
router.get('/active', authMiddleware, shiftController.getActiveShift);
router.post('/open', authMiddleware, shiftController.openShift);
router.post('/capital', authMiddleware, shiftController.addCapitalContribution);
router.post('/close', authMiddleware, shiftController.closeShift);
router.post('/return-capital', authMiddleware, shiftController.returnCapitalContribution);

export default router;
