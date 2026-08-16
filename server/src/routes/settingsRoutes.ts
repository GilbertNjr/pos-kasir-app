import { Router } from 'express';
import { settingsController } from '../controllers/SettingsController';
import { authMiddleware } from '../middlewares/AuthMiddleware';
import { requireOwner } from '../middlewares/rbacMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', settingsController.getSettings);
router.put('/', requireOwner, settingsController.updateSettings);

export default router;
