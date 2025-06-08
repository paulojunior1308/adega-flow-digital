import { Router } from 'express';
import { doseController } from '../controllers/dose.controller';
import { upload } from '../utils/cloudinary';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', upload.single('image'), doseController.create);
router.put('/:id', upload.single('image'), doseController.update);
router.delete('/:id', doseController.delete);
router.get('/', doseController.list);
router.get('/:id', doseController.getById);

export default router; 