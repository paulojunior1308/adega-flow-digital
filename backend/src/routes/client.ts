import express from 'express';
import { authMiddleware } from '../middlewares/auth';
import { authorizeRoles } from '../middlewares/role';
import { clientController } from '../controllers/client';
import { addressController } from '../controllers/address';
import { cartController } from '../controllers/cart';
import { orderController } from '../controllers/order';
import { productController } from '../controllers/product';
import { upload } from '../config/multer';
import { comboController } from '../controllers/combo';
import { promotionController } from '../controllers/promotion';

const router = express.Router();

// Rotas públicas
router.post('/register', clientController.register);
router.get('/combos', comboController.list);
router.get('/promotions', promotionController.list);

// Rotas de produtos (acessível para todos os usuários autenticados)
router.get('/products', productController.list);

// Middleware de autenticação
router.use(authMiddleware);

// Rotas de endereço do cliente
router.get('/addresses', addressController.list);
router.post('/addresses', addressController.create);
router.put('/addresses/:id', addressController.update);
router.delete('/addresses/:id', addressController.remove);

// Rotas do carrinho do cliente
router.get('/cart', cartController.getCart);
router.post('/cart', cartController.addItem);
router.put('/cart/:itemId', cartController.updateItem);
router.delete('/cart/:itemId', cartController.removeItem);

// Rotas de pedidos do cliente
router.get('/orders', orderController.list);
router.post('/orders', orderController.create);
router.post('/orders/calculate-delivery-fee', orderController.calculateDeliveryFee);

// Rota para alteração de senha do cliente
router.put('/cliente-perfil/senha', clientController.changePassword);

// Notificações do cliente
router.get('/notifications', clientController.getNotifications);
router.put('/notifications/:id/read', clientController.readNotification);

export default router; 