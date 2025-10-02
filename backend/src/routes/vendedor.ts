import express from 'express';
import { vendedorController } from '../controllers/vendedor';
import { vendedorMiddleware, vendedorOrAdminMiddleware } from '../middlewares/vendedor';

const router = express.Router();

// Aplicar middleware de vendedor em todas as rotas
router.use(vendedorMiddleware);

// Dashboard do vendedor
router.get('/dashboard', vendedorController.getDashboard);

// Gestão de produtos (apenas visualização)
router.get('/products', vendedorController.getProducts);
router.get('/categories', vendedorController.getCategories);

// Gestão de estoque (apenas visualização)
router.get('/stock', vendedorController.getStock);

// Gestão de vendas (PDV)
router.get('/sales', vendedorController.getSales);
router.post('/sales', vendedorController.createSale);

export default router;
