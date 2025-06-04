import express from 'express';
import { authMiddleware, adminMiddleware } from '../middlewares/auth';
import { authorizeRoles } from '../middlewares/role';
import { adminController } from '../controllers/admin';
import { orderController } from '../controllers/order';
import { productController } from '../controllers/product';
import { Router } from 'express';
import prisma from '../config/prisma';
import { isAdmin } from '../middlewares/auth';
import { promotionController } from '../controllers/promotion';
import multer from 'multer';
import path from 'path';
import { comboController } from '../controllers/combo';
import { supplierController } from '../controllers/supplier';
import { paymentMethodController } from '../controllers/paymentMethod';

const router = express.Router();

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Rotas públicas
router.post('/login', adminController.login);

// Middleware de autenticação para todas as rotas administrativas
router.use(authMiddleware, adminMiddleware);
router.use(authorizeRoles('ADMIN'));

// Rotas protegidas - apenas ADMIN
router.get('/dashboard', adminController.dashboard);
router.post('/users', adminController.createUser);
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Rotas de pedidos para admin
router.get('/orders', orderController.adminList);
router.patch('/orders/:id/status', orderController.updateStatus);
router.patch('/orders/:id/location', orderController.updateLocation);
router.patch('/orders/:id/pix-status', orderController.updatePixStatus);

// Rotas de produtos
router.get('/products', productController.list);
router.get('/products/categories', productController.listCategories);
router.post('/products', productController.create);
router.put('/products/:id', productController.update);
router.delete('/products/:id', productController.delete);
router.patch('/products/:id/pinned', productController.updatePinned);
router.put('/products/:id/stock', productController.updateStock);

// Rotas de combos
router.get('/combos', comboController.list);
router.post('/combos', upload.single('image'), comboController.create);
router.put('/combos/:id', upload.single('image'), comboController.update);
router.delete('/combos/:id', comboController.delete);
router.patch('/combos/:id/active', comboController.updateActive);

// Rotas de promoções e combos
router.get('/products/promos-combos', productController.listPromosCombos);
router.patch('/products/:id/promos-combos', productController.updatePromosCombos);

// Rotas de promoções
router.get('/promotions', promotionController.list);
router.post('/promotions', upload.single('image'), promotionController.create);
router.put('/promotions/:id', upload.single('image'), promotionController.update);
router.delete('/promotions/:id', promotionController.delete);
router.patch('/promotions/:id/active', async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  try {
    const promotion = await prisma.promotion.update({
      where: { id },
      data: { active: Boolean(active) },
    });
    res.json(promotion);
  } catch (error) {
    res.status(404).json({ error: 'Promoção não encontrada' });
  }
});

// Rota para listar categorias
router.get('/categories', productController.listCategories);

// Rotas de fornecedores
router.get('/suppliers', supplierController.list);
router.post('/suppliers', supplierController.create);
router.get('/suppliers/:id', supplierController.get);
router.put('/suppliers/:id', supplierController.update);
router.delete('/suppliers/:id', supplierController.delete);

// Rotas de métodos de pagamento
router.get('/payment-methods', paymentMethodController.list);
router.post('/payment-methods', paymentMethodController.create);
router.get('/payment-methods/:id', paymentMethodController.get);
router.put('/payment-methods/:id', paymentMethodController.update);
router.delete('/payment-methods/:id', paymentMethodController.delete);

// Rota para vendas do PDV físico
router.post('/pdv-sales', adminController.createPDVSale);
router.get('/pdv-sales', adminController.getPDVSales);

export default router; 