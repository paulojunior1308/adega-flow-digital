import express from 'express';
import { authMiddleware, adminMiddleware } from '../middlewares/auth';
import { comandaController } from '../controllers/comanda';

const router = express.Router();

// Todas as rotas requerem autenticação e role de admin ou vendedor
router.use(authMiddleware);

// Rotas de comandas
router.get('/comandas', comandaController.list);
router.post('/comandas', comandaController.create);
router.get('/comandas/:id', comandaController.getById);
router.put('/comandas/:id/close', comandaController.close);
router.put('/comandas/:id/reopen', comandaController.reopen);
router.delete('/comandas/:id', comandaController.delete);

// Rotas de itens da comanda
router.post('/comandas/:comandaId/items', comandaController.addItem);
router.put('/comandas/:comandaId/items/:itemId', comandaController.updateItemQuantity);
router.delete('/comandas/:comandaId/items/:itemId', comandaController.removeItem);

export default router; 