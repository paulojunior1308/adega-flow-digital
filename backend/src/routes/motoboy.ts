import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { motoboyMiddleware } from '../middlewares/motoboy';
import { orderController } from '../controllers/order';

const router = Router();

// Aplicar middlewares de autenticação e motoboy em todas as rotas
router.use(authMiddleware, motoboyMiddleware);

// Rotas de pedidos
router.get('/orders', orderController.motoboyList);
router.patch('/orders/:id/status', orderController.motoboyUpdateStatus);
router.patch('/orders/:id/location', orderController.updateLocation);

export default router; 