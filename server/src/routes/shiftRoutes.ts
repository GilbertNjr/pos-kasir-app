import { Router } from 'express';
import {
  shiftRepository,
  shiftUserRepository,
  shiftCapitalContributionRepository as capitalRepository,
  userRepository,
  backupService,
} from '../repositories/sharedRepositories';
import { ShiftService } from '../services/ShiftService';
import { ShiftController } from '../controllers/ShiftController';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

const shiftService = new ShiftService(shiftRepository, shiftUserRepository, capitalRepository, userRepository, backupService);
const shiftController = new ShiftController(shiftService);

// Authenticated Routes
router.get('/active', authMiddleware, shiftController.getActiveShift);
router.get('/history', authMiddleware, shiftController.getShiftHistory);
router.get('/:shift_id/details', authMiddleware, shiftController.getShiftDetails);
router.post('/open', authMiddleware, shiftController.openShift);
router.put('/metadata', authMiddleware, shiftController.updateShiftMetadata);
router.post('/capital', authMiddleware, shiftController.addCapitalContribution);
router.post('/close', authMiddleware, shiftController.closeShift);
router.post('/return-capital', authMiddleware, shiftController.returnCapitalContribution);

export default router;
