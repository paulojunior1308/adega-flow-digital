import express from 'express';
import { authMiddleware } from '../middlewares/auth';
import { authorizeRoles } from '../middlewares/role';
import { adminController } from '../controllers/admin';
import { clientController } from '../controllers/client';
import clientRoutes from './client';
import adminRoutes from './admin';
import { orderController } from '../controllers/order';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import motoboyRoutes from './motoboy';
import { productController } from '../controllers/product';
import { comboController } from '../controllers/combo';
import { promotionController } from '../controllers/promotion';
import { motoboyMiddleware } from '../middlewares/motoboy';
import prisma from '../config/prisma';
import publicRoutes from './public';
import doseRoutes from './dose.routes';

const router = express.Router();

// Rotas públicas (login e registro)
router.post('/login', clientController.login);
router.post('/register', clientController.register);

// Todas as outras rotas públicas (produtos, categorias, combos, promoções)
router.use('/', publicRoutes);

// Rotas administrativas
router.use('/admin', authMiddleware, authorizeRoles('ADMIN'), adminRoutes);

// Rotas do motoboy
router.use('/motoboy', authMiddleware, motoboyMiddleware, motoboyRoutes);

// Middleware de autenticação para todas as rotas protegidas
router.use(authMiddleware);

// Rotas do Cliente
router.get('/cliente-dashboard', authorizeRoles('USER'), clientController.getDashboard);
router.get('/cliente-catalogo', authorizeRoles('USER'), clientController.getCatalogo);
router.get('/cliente-buscar', authorizeRoles('USER'), clientController.buscarProdutos);
router.get('/cliente-carrinho', authorizeRoles('USER'), clientController.getCarrinho);
router.get('/cliente-enderecos', authorizeRoles('USER'), clientController.getEnderecos);
router.get('/cliente-pedidos', authorizeRoles('USER'), clientController.getPedidos);
router.get('/cliente-perfil', authorizeRoles('USER'), clientController.getProfile);

// Rotas do Admin
router.get('/admin-dashboard', authorizeRoles('ADMIN'), adminController.dashboard);
router.get('/admin-estoque', authorizeRoles('ADMIN'), adminController.getEstoque);
router.get('/admin-cadastro-produtos', authorizeRoles('ADMIN'), adminController.getCadastroProdutos);
router.get('/admin-pedidos', authorizeRoles('ADMIN'), adminController.getPedidos);
router.get('/admin-relatorios', authorizeRoles('ADMIN'), adminController.getRelatorios);
router.get('/admin-configuracoes', authorizeRoles('ADMIN'), adminController.getConfiguracoes);
router.get('/admin-pdv', authorizeRoles('ADMIN'), adminController.getPDV);

router.use('/', clientRoutes);

// Rotas públicas de doses
router.use('/doses', doseRoutes);

// Rotas de doses protegidas para admin
router.use('/admin/doses', authMiddleware, authorizeRoles('ADMIN'), doseRoutes);

export default router; 