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
import { financeController } from '../controllers/finance';
import { stockEntryController } from '../controllers/stockEntry';
import { categoryController } from '../controllers/category';
import { offerController } from '../controllers/offer';
import { comandaController } from '../controllers/comanda';

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
router.get('/categories', categoryController.list);
router.get('/categories/:id', categoryController.get);
router.post('/categories', categoryController.create);
router.put('/categories/:id', categoryController.update);
router.delete('/categories/:id', categoryController.delete);
router.patch('/categories/:id/active', categoryController.updateActive);

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
// Rota para atualizar método de pagamento da venda PDV
router.patch('/pdv-sales/:id/payment-method', adminController.updatePDVSale);

// Rota para relatório financeiro
router.get('/finance/report', financeController.report);

// Rotas de entradas de estoque
router.post('/stock-entries', stockEntryController.create);
router.get('/stock-entries', stockEntryController.list);

// Rota para baixa manual de estoque
router.post('/stock-out', stockEntryController.stockOut);

// Rota para listar movimentações de estoque
router.get('/stock-movements', stockEntryController.listMovements);

// Rota para backup completo do banco de dados (estrutura + dados)
router.get('/backup', async (req, res) => {
  try {
    // Buscar todos os dados principais do banco
    const users = await prisma.user.findMany();
    const categories = await prisma.category.findMany();
    const suppliers = await prisma.supplier.findMany();
    const paymentMethods = await prisma.paymentMethod.findMany();
    const products = await prisma.product.findMany();
    const promotions = await prisma.promotion.findMany();
    const combos = await prisma.combo.findMany();
    const comboItems = await prisma.comboItem.findMany();
    const doses = await prisma.dose.findMany();
    const doseItems = await prisma.doseItem.findMany();
    const addresses = await prisma.address.findMany();
    const orders = await prisma.order.findMany();
    const orderItems = await prisma.orderItem.findMany();
    const stockEntries = await prisma.stockEntry.findMany();
    const notifications = await prisma.notification.findMany();
    
    // Tabelas de vendas e financeiro (que estavam faltando)
    const clients = await prisma.client.findMany();
    const sales = await prisma.sale.findMany();
    const saleItems = await prisma.saleItem.findMany();
    const cashFlows = await prisma.cashFlow.findMany();
    const accountPayables = await prisma.accountPayable.findMany();
    const stockMovements = await prisma.stockMovement.findMany();
    // const comandas = await prisma.comanda.findMany();
    // const comandaItems = await prisma.comandaItem.findMany();

    // Gerar SQL completo com estrutura + dados
    let sqlContent = `-- Backup completo do banco de dados - ${new Date().toISOString()}\n`;
    sqlContent += `-- Gerado automaticamente para migração Supabase\n`;
    sqlContent += `-- Inclui estrutura das tabelas + dados\n`;
    sqlContent += `-- Compatível com PostgreSQL padrão\n\n`;
    
    // Extensões necessárias
    sqlContent += `-- Extensões necessárias\n`;
    sqlContent += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`;
    
    // Schema das tabelas
    sqlContent += `-- ========================================\n`;
    sqlContent += `-- CRIAR TABELAS\n`;
    sqlContent += `-- ========================================\n\n`;
    
    // Tabela User
    sqlContent += `CREATE TABLE "User" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "name" TEXT NOT NULL,\n`;
    sqlContent += `    "email" TEXT UNIQUE NOT NULL,\n`;
    sqlContent += `    "cpf" TEXT UNIQUE NOT NULL,\n`;
    sqlContent += `    "password" TEXT NOT NULL,\n`;
    sqlContent += `    "phone" TEXT,\n`;
    sqlContent += `    "role" TEXT NOT NULL DEFAULT 'USER',\n`;
    sqlContent += `    "active" BOOLEAN NOT NULL DEFAULT true,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    "updatedAt" TIMESTAMP(3) NOT NULL\n`;
    sqlContent += `);\n\n`;
    
    // Tabela Category
    sqlContent += `CREATE TABLE "Category" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "name" TEXT NOT NULL,\n`;
    sqlContent += `    "description" TEXT,\n`;
    sqlContent += `    "active" BOOLEAN NOT NULL DEFAULT true,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    "updatedAt" TIMESTAMP(3) NOT NULL\n`;
    sqlContent += `);\n\n`;
    
    // Tabela Supplier
    sqlContent += `CREATE TABLE "Supplier" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "name" TEXT NOT NULL,\n`;
    sqlContent += `    "email" TEXT UNIQUE,\n`;
    sqlContent += `    "phone" TEXT,\n`;
    sqlContent += `    "document" TEXT UNIQUE,\n`;
    sqlContent += `    "address" TEXT,\n`;
    sqlContent += `    "active" BOOLEAN NOT NULL DEFAULT true,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    sqlContent += `    "category" TEXT,\n`;
    sqlContent += `    "contact" TEXT\n`;
    sqlContent += `);\n\n`;
    
    // Tabela PaymentMethod
    sqlContent += `CREATE TABLE "PaymentMethod" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "name" TEXT UNIQUE NOT NULL,\n`;
    sqlContent += `    "active" BOOLEAN NOT NULL DEFAULT true,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    "updatedAt" TIMESTAMP(3) NOT NULL\n`;
    sqlContent += `);\n\n`;
    
    // Tabela Product
    sqlContent += `CREATE TABLE "Product" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "name" TEXT NOT NULL,\n`;
    sqlContent += `    "description" TEXT,\n`;
    sqlContent += `    "price" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "costPrice" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "margin" DOUBLE PRECISION,\n`;
    sqlContent += `    "stock" INTEGER NOT NULL DEFAULT 0,\n`;
    sqlContent += `    "minStock" INTEGER NOT NULL DEFAULT 0,\n`;
    sqlContent += `    "barcode" TEXT UNIQUE,\n`;
    sqlContent += `    "sku" TEXT UNIQUE,\n`;
    sqlContent += `    "active" BOOLEAN NOT NULL DEFAULT true,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    sqlContent += `    "categoryId" TEXT NOT NULL,\n`;
    sqlContent += `    "supplierId" TEXT,\n`;
    sqlContent += `    "image" TEXT,\n`;
    sqlContent += `    "isCombo" BOOLEAN NOT NULL DEFAULT false,\n`;
    sqlContent += `    "isPromotion" BOOLEAN NOT NULL DEFAULT false,\n`;
    sqlContent += `    "pinned" BOOLEAN NOT NULL DEFAULT false,\n`;
    sqlContent += `    "isFractioned" BOOLEAN NOT NULL DEFAULT false,\n`;
    sqlContent += `    "totalVolume" DOUBLE PRECISION,\n`;
    sqlContent += `    "unitVolume" DOUBLE PRECISION,\n`;
    sqlContent += `    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT,\n`;
    sqlContent += `    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL\n`;
    sqlContent += `);\n\n`;
    
    // Tabela Promotion
    sqlContent += `CREATE TABLE "Promotion" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "name" TEXT NOT NULL,\n`;
    sqlContent += `    "description" TEXT NOT NULL,\n`;
    sqlContent += `    "price" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "originalPrice" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "image" TEXT,\n`;
    sqlContent += `    "active" BOOLEAN NOT NULL DEFAULT true,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    "updatedAt" TIMESTAMP(3) NOT NULL\n`;
    sqlContent += `);\n\n`;
    
    // Tabela Combo
    sqlContent += `CREATE TABLE "Combo" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "name" TEXT NOT NULL,\n`;
    sqlContent += `    "description" TEXT NOT NULL,\n`;
    sqlContent += `    "price" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "image" TEXT,\n`;
    sqlContent += `    "active" BOOLEAN NOT NULL DEFAULT true,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    sqlContent += `    "categoryId" TEXT,\n`;
    sqlContent += `    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL\n`;
    sqlContent += `);\n\n`;
    
    // Tabela ComboItem
    sqlContent += `CREATE TABLE "ComboItem" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "comboId" TEXT NOT NULL,\n`;
    sqlContent += `    "productId" TEXT NOT NULL,\n`;
    sqlContent += `    "quantity" INTEGER NOT NULL DEFAULT 1,\n`;
    sqlContent += `    "allowFlavorSelection" BOOLEAN NOT NULL DEFAULT false,\n`;
    sqlContent += `    "maxFlavors" INTEGER NOT NULL DEFAULT 1,\n`;
    sqlContent += `    "categoryId" TEXT,\n`;
    sqlContent += `    "nameFilter" TEXT,\n`;
    sqlContent += `    FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE CASCADE,\n`;
    sqlContent += `    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE,\n`;
    sqlContent += `    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL\n`;
    sqlContent += `);\n\n`;
    
    // Tabela Dose
    sqlContent += `CREATE TABLE "Dose" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "name" TEXT NOT NULL,\n`;
    sqlContent += `    "description" TEXT,\n`;
    sqlContent += `    "price" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "image" TEXT,\n`;
    sqlContent += `    "active" BOOLEAN NOT NULL DEFAULT true,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    sqlContent += `    "categoryId" TEXT,\n`;
    sqlContent += `    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL\n`;
    sqlContent += `);\n\n`;
    
    // Tabela DoseItem
    sqlContent += `CREATE TABLE "DoseItem" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "doseId" TEXT NOT NULL,\n`;
    sqlContent += `    "productId" TEXT NOT NULL,\n`;
    sqlContent += `    "quantity" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "allowFlavorSelection" BOOLEAN NOT NULL DEFAULT false,\n`;
    sqlContent += `    "categoryId" TEXT,\n`;
    sqlContent += `    "discountBy" TEXT NOT NULL,\n`;
    sqlContent += `    "nameFilter" TEXT,\n`;
    sqlContent += `    "volumeToDiscount" DOUBLE PRECISION,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    sqlContent += `    FOREIGN KEY ("doseId") REFERENCES "Dose"("id") ON DELETE CASCADE,\n`;
    sqlContent += `    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE,\n`;
    sqlContent += `    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL\n`;
    sqlContent += `);\n\n`;
    
    // Tabela Address
    sqlContent += `CREATE TABLE "Address" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "userId" TEXT NOT NULL,\n`;
    sqlContent += `    "title" TEXT NOT NULL,\n`;
    sqlContent += `    "street" TEXT NOT NULL,\n`;
    sqlContent += `    "number" TEXT NOT NULL,\n`;
    sqlContent += `    "complement" TEXT,\n`;
    sqlContent += `    "neighborhood" TEXT NOT NULL,\n`;
    sqlContent += `    "city" TEXT NOT NULL,\n`;
    sqlContent += `    "state" TEXT NOT NULL,\n`;
    sqlContent += `    "zipcode" TEXT NOT NULL,\n`;
    sqlContent += `    "isDefault" BOOLEAN NOT NULL DEFAULT false,\n`;
    sqlContent += `    "lat" DOUBLE PRECISION,\n`;
    sqlContent += `    "lng" DOUBLE PRECISION,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    sqlContent += `    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE\n`;
    sqlContent += `);\n\n`;
    
    // Tabela Client
    sqlContent += `CREATE TABLE "Client" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "name" TEXT NOT NULL,\n`;
    sqlContent += `    "email" TEXT UNIQUE,\n`;
    sqlContent += `    "phone" TEXT,\n`;
    sqlContent += `    "document" TEXT UNIQUE,\n`;
    sqlContent += `    "address" TEXT,\n`;
    sqlContent += `    "active" BOOLEAN NOT NULL DEFAULT true,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    "updatedAt" TIMESTAMP(3) NOT NULL\n`;
    sqlContent += `);\n\n`;
    
    // Tabela Sale
    sqlContent += `CREATE TABLE "Sale" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "status" TEXT NOT NULL DEFAULT 'PENDING',\n`;
    sqlContent += `    "total" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    sqlContent += `    "userId" TEXT NOT NULL,\n`;
    sqlContent += `    "clientId" TEXT,\n`;
    sqlContent += `    "paymentMethodId" TEXT,\n`;
    sqlContent += `    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT,\n`;
    sqlContent += `    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL,\n`;
    sqlContent += `    FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL\n`;
    sqlContent += `);\n\n`;
    
    // Tabela SaleItem
    sqlContent += `CREATE TABLE "SaleItem" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "quantity" INTEGER NOT NULL,\n`;
    sqlContent += `    "price" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "costPrice" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    "saleId" TEXT NOT NULL,\n`;
    sqlContent += `    "productId" TEXT NOT NULL,\n`;
    sqlContent += `    "isDoseItem" BOOLEAN NOT NULL DEFAULT false,\n`;
    sqlContent += `    "isFractioned" BOOLEAN NOT NULL DEFAULT false,\n`;
    sqlContent += `    "discountBy" TEXT,\n`;
    sqlContent += `    "choosableSelections" JSONB,\n`;
    sqlContent += `    FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE,\n`;
    sqlContent += `    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT\n`;
    sqlContent += `);\n\n`;
    
    // Tabela CashFlow
    sqlContent += `CREATE TABLE "CashFlow" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "type" TEXT NOT NULL,\n`;
    sqlContent += `    "amount" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "description" TEXT NOT NULL,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    "userId" TEXT NOT NULL,\n`;
    sqlContent += `    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT\n`;
    sqlContent += `);\n\n`;
    
    // Tabela AccountPayable
    sqlContent += `CREATE TABLE "AccountPayable" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "description" TEXT NOT NULL,\n`;
    sqlContent += `    "value" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "dueDate" TIMESTAMP(3) NOT NULL,\n`;
    sqlContent += `    "status" TEXT NOT NULL DEFAULT 'PENDING',\n`;
    sqlContent += `    "type" TEXT NOT NULL,\n`;
    sqlContent += `    "observations" TEXT,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    "updatedAt" TIMESTAMP(3) NOT NULL\n`;
    sqlContent += `);\n\n`;
    
    // Tabela StockMovement
    sqlContent += `CREATE TABLE "StockMovement" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    "productId" TEXT NOT NULL,\n`;
    sqlContent += `    "type" TEXT NOT NULL,\n`;
    sqlContent += `    "quantity" INTEGER NOT NULL,\n`;
    sqlContent += `    "unitCost" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "totalCost" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "notes" TEXT,\n`;
    sqlContent += `    "origin" TEXT,\n`;
    sqlContent += `    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT\n`;
    sqlContent += `);\n\n`;
    
    // Tabela Comanda
    sqlContent += `CREATE TABLE "Comanda" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "number" INTEGER UNIQUE NOT NULL,\n`;
    sqlContent += `    "customerName" TEXT NOT NULL,\n`;
    sqlContent += `    "tableNumber" TEXT,\n`;
    sqlContent += `    "isOpen" BOOLEAN NOT NULL DEFAULT true,\n`;
    sqlContent += `    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    sqlContent += `    "createdBy" TEXT NOT NULL,\n`;
    sqlContent += `    FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT\n`;
    sqlContent += `);\n\n`;
    
    // Tabela ComandaItem
    sqlContent += `CREATE TABLE "ComandaItem" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "comandaId" TEXT NOT NULL,\n`;
    sqlContent += `    "productId" TEXT NOT NULL,\n`;
    sqlContent += `    "code" TEXT NOT NULL,\n`;
    sqlContent += `    "name" TEXT NOT NULL,\n`;
    sqlContent += `    "quantity" INTEGER NOT NULL,\n`;
    sqlContent += `    "price" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "total" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "isDoseItem" BOOLEAN NOT NULL DEFAULT false,\n`;
    sqlContent += `    "isFractioned" BOOLEAN NOT NULL DEFAULT false,\n`;
    sqlContent += `    "discountBy" TEXT,\n`;
    sqlContent += `    "choosableSelections" JSONB,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    FOREIGN KEY ("comandaId") REFERENCES "Comanda"("id") ON DELETE CASCADE,\n`;
    sqlContent += `    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT\n`;
    sqlContent += `);\n\n`;
    
    // Tabela Order
    sqlContent += `CREATE TABLE "Order" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "userId" TEXT NOT NULL,\n`;
    sqlContent += `    "addressId" TEXT NOT NULL,\n`;
    sqlContent += `    "status" TEXT NOT NULL DEFAULT 'PENDING',\n`;
    sqlContent += `    "total" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "instructions" TEXT,\n`;
    sqlContent += `    "deliveryLat" DOUBLE PRECISION,\n`;
    sqlContent += `    "deliveryLng" DOUBLE PRECISION,\n`;
    sqlContent += `    "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    sqlContent += `    "paymentMethodId" TEXT,\n`;
    sqlContent += `    "pixPaymentStatus" TEXT DEFAULT 'PENDING',\n`;
    sqlContent += `    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT,\n`;
    sqlContent += `    FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT,\n`;
    sqlContent += `    FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL\n`;
    sqlContent += `);\n\n`;
    
    // Tabela OrderItem
    sqlContent += `CREATE TABLE "OrderItem" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "orderId" TEXT NOT NULL,\n`;
    sqlContent += `    "productId" TEXT NOT NULL,\n`;
    sqlContent += `    "quantity" INTEGER NOT NULL DEFAULT 1,\n`;
    sqlContent += `    "price" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "costPrice" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "doseId" TEXT,\n`;
    sqlContent += `    "comboInstanceId" TEXT,\n`;
    sqlContent += `    "doseInstanceId" TEXT,\n`;
    sqlContent += `    "choosableSelections" JSONB,\n`;
    sqlContent += `    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE,\n`;
    sqlContent += `    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT,\n`;
    sqlContent += `    FOREIGN KEY ("doseId") REFERENCES "Dose"("id") ON DELETE SET NULL\n`;
    sqlContent += `);\n\n`;
    
    // Tabela StockEntry
    sqlContent += `CREATE TABLE "StockEntry" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "productId" TEXT NOT NULL,\n`;
    sqlContent += `    "quantity" INTEGER NOT NULL,\n`;
    sqlContent += `    "unitCost" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "totalCost" DOUBLE PRECISION NOT NULL,\n`;
    sqlContent += `    "supplierId" TEXT,\n`;
    sqlContent += `    "notes" TEXT,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE,\n`;
    sqlContent += `    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL\n`;
    sqlContent += `);\n\n`;
    
    // Tabela Notification
    sqlContent += `CREATE TABLE "Notification" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "userId" TEXT NOT NULL,\n`;
    sqlContent += `    "orderId" TEXT,\n`;
    sqlContent += `    "message" TEXT NOT NULL,\n`;
    sqlContent += `    "read" BOOLEAN NOT NULL DEFAULT false,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,\n`;
    sqlContent += `    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE\n`;
    sqlContent += `);\n\n`;
    
    // Tabela Cart
    sqlContent += `CREATE TABLE "Cart" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "userId" TEXT UNIQUE NOT NULL,\n`;
    sqlContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    sqlContent += `    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE\n`;
    sqlContent += `);\n\n`;
    
    // Tabela CartItem
    sqlContent += `CREATE TABLE "CartItem" (\n`;
    sqlContent += `    "id" TEXT PRIMARY KEY,\n`;
    sqlContent += `    "cartId" TEXT NOT NULL,\n`;
    sqlContent += `    "productId" TEXT NOT NULL,\n`;
    sqlContent += `    "quantity" INTEGER NOT NULL DEFAULT 1,\n`;
    sqlContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sqlContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    sqlContent += `    FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE,\n`;
    sqlContent += `    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE\n`;
    sqlContent += `);\n\n`;
    
    // Índices para melhor performance
    sqlContent += `-- ========================================\n`;
    sqlContent += `-- ÍNDICES PARA PERFORMANCE\n`;
    sqlContent += `-- ========================================\n\n`;
    
    sqlContent += `CREATE INDEX "User_email_idx" ON "User"("email");\n`;
    sqlContent += `CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");\n`;
    sqlContent += `CREATE INDEX "Product_active_idx" ON "Product"("active");\n`;
    sqlContent += `CREATE INDEX "Order_userId_idx" ON "Order"("userId");\n`;
    sqlContent += `CREATE INDEX "Order_status_idx" ON "Order"("status");\n`;
    sqlContent += `CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");\n`;
    sqlContent += `CREATE INDEX "Address_userId_idx" ON "Address"("userId");\n`;
    sqlContent += `CREATE INDEX "ComboItem_comboId_idx" ON "ComboItem"("comboId");\n`;
    sqlContent += `CREATE INDEX "DoseItem_doseId_idx" ON "DoseItem"("doseId");\n`;
    sqlContent += `CREATE INDEX "StockEntry_productId_idx" ON "StockEntry"("productId");\n`;
    sqlContent += `CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");\n`;
    sqlContent += `CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");\n\n`;
    
    // Dados
    sqlContent += `-- ========================================\n`;
    sqlContent += `-- INSERIR DADOS\n`;
    sqlContent += `-- ========================================\n\n`;
    
    // Desabilitar triggers temporariamente
    sqlContent += `-- Desabilitar triggers para evitar conflitos\n`;
    sqlContent += `SET session_replication_role = replica;\n\n`;
    
    // Inserir dados
    sqlContent += `-- Inserir Users\n`;
    users.forEach(user => {
      sqlContent += `INSERT INTO "User" ("id", "name", "email", "cpf", "password", "phone", "role", "active", "createdAt", "updatedAt") VALUES (`;
      sqlContent += `'${user.id}'::uuid, '${user.name.replace(/'/g, "''")}', '${user.email}', '${user.cpf}', '${user.password}', `;
      sqlContent += `${user.phone ? `'${user.phone.replace(/'/g, "''")}'` : 'NULL'}, '${user.role}', ${user.active}, `;
      sqlContent += `'${user.createdAt.toISOString()}'::timestamp, '${user.updatedAt.toISOString()}'::timestamp);\n`;
    });
    sqlContent += `\n`;
    
    sqlContent += `-- Inserir Categories\n`;
    categories.forEach(category => {
      sqlContent += `INSERT INTO "Category" ("id", "name", "description", "active", "createdAt", "updatedAt") VALUES (`;
      sqlContent += `'${category.id}'::uuid, '${category.name.replace(/'/g, "''")}', `;
      sqlContent += `${category.description ? `'${category.description.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${category.active}, '${category.createdAt.toISOString()}'::timestamp, '${category.updatedAt.toISOString()}'::timestamp);\n`;
    });
    sqlContent += `\n`;
    
    sqlContent += `-- Inserir Suppliers\n`;
    suppliers.forEach(supplier => {
      sqlContent += `INSERT INTO "Supplier" ("id", "name", "email", "phone", "document", "address", "active", "createdAt", "updatedAt", "category", "contact") VALUES (`;
      sqlContent += `'${supplier.id}'::uuid, '${supplier.name.replace(/'/g, "''")}', `;
      sqlContent += `${supplier.email ? `'${supplier.email.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${supplier.phone ? `'${supplier.phone.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${supplier.document ? `'${supplier.document.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${supplier.address ? `'${supplier.address.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${supplier.active}, '${supplier.createdAt.toISOString()}'::timestamp, '${supplier.updatedAt.toISOString()}'::timestamp, `;
      sqlContent += `${supplier.category ? `'${supplier.category.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${supplier.contact ? `'${supplier.contact.replace(/'/g, "''")}'` : 'NULL'});\n`;
    });
    sqlContent += `\n`;
    
    sqlContent += `-- Inserir PaymentMethods\n`;
    paymentMethods.forEach(paymentMethod => {
      sqlContent += `INSERT INTO "PaymentMethod" ("id", "name", "active", "createdAt", "updatedAt") VALUES (`;
      sqlContent += `'${paymentMethod.id}'::uuid, '${paymentMethod.name.replace(/'/g, "''")}', `;
      sqlContent += `${paymentMethod.active}, '${paymentMethod.createdAt.toISOString()}'::timestamp, '${paymentMethod.updatedAt.toISOString()}'::timestamp);\n`;
    });
    sqlContent += `\n`;
    
    sqlContent += `-- Inserir Products\n`;
    products.forEach(product => {
      sqlContent += `INSERT INTO "Product" ("id", "name", "description", "price", "costPrice", "margin", "stock", "minStock", "barcode", "sku", "active", "createdAt", "updatedAt", "categoryId", "supplierId", "image", "isCombo", "isPromotion", "pinned", "isFractioned", "totalVolume", "unitVolume") VALUES (`;
      sqlContent += `'${product.id}'::uuid, '${product.name.replace(/'/g, "''")}', `;
      sqlContent += `${product.description ? `'${product.description.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${product.price}, ${product.costPrice}, `;
      sqlContent += `${product.margin ? product.margin : 'NULL'}, `;
      sqlContent += `${product.stock}, ${product.minStock}, `;
      sqlContent += `${product.barcode ? `'${product.barcode.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${product.sku ? `'${product.sku.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${product.active}, '${product.createdAt.toISOString()}'::timestamp, '${product.updatedAt.toISOString()}'::timestamp, `;
      sqlContent += `'${product.categoryId}'::uuid, `;
      sqlContent += `${product.supplierId ? `'${product.supplierId}'::uuid` : 'NULL'}, `;
      sqlContent += `${product.image ? `'${product.image.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${product.isCombo}, ${product.isPromotion}, ${product.pinned}, `;
      sqlContent += `${product.isFractioned}, `;
      sqlContent += `${product.totalVolume ? product.totalVolume : 'NULL'}, `;
      sqlContent += `${product.unitVolume ? product.unitVolume : 'NULL'});\n`;
    });
    sqlContent += `\n`;
    
    sqlContent += `-- Inserir Promotions\n`;
    promotions.forEach(promotion => {
      sqlContent += `INSERT INTO "Promotion" ("id", "name", "description", "price", "originalPrice", "image", "active", "createdAt", "updatedAt") VALUES (`;
      sqlContent += `'${promotion.id}'::uuid, '${promotion.name.replace(/'/g, "''")}', '${promotion.description.replace(/'/g, "''")}', `;
      sqlContent += `${promotion.price}, ${promotion.originalPrice}, `;
      sqlContent += `${promotion.image ? `'${promotion.image.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${promotion.active}, '${promotion.createdAt.toISOString()}'::timestamp, '${promotion.updatedAt.toISOString()}'::timestamp);\n`;
    });
    sqlContent += `\n`;
    
    sqlContent += `-- Inserir Combos\n`;
    combos.forEach(combo => {
      sqlContent += `INSERT INTO "Combo" ("id", "name", "description", "price", "image", "active", "createdAt", "updatedAt", "categoryId") VALUES (`;
      sqlContent += `'${combo.id}'::uuid, '${combo.name.replace(/'/g, "''")}', '${combo.description.replace(/'/g, "''")}', `;
      sqlContent += `${combo.price}, `;
      sqlContent += `${combo.image ? `'${combo.image.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${combo.active}, '${combo.createdAt.toISOString()}'::timestamp, '${combo.updatedAt.toISOString()}'::timestamp, `;
      sqlContent += `${combo.categoryId ? `'${combo.categoryId}'::uuid` : 'NULL'});\n`;
    });
    sqlContent += `\n`;
    
    sqlContent += `-- Inserir ComboItems\n`;
    comboItems.forEach(comboItem => {
      sqlContent += `INSERT INTO "ComboItem" ("id", "comboId", "productId", "quantity", "allowFlavorSelection", "maxFlavors", "categoryId", "nameFilter") VALUES (`;
      sqlContent += `'${comboItem.id}'::uuid, '${comboItem.comboId}'::uuid, '${comboItem.productId}'::uuid, `;
      sqlContent += `${comboItem.quantity}, ${comboItem.allowFlavorSelection}, ${comboItem.maxFlavors}, `;
      sqlContent += `${comboItem.categoryId ? `'${comboItem.categoryId}'::uuid` : 'NULL'}, `;
      sqlContent += `${comboItem.nameFilter ? `'${comboItem.nameFilter.replace(/'/g, "''")}'` : 'NULL'});\n`;
    });
    sqlContent += `\n`;
    
    sqlContent += `-- Inserir Doses\n`;
    doses.forEach(dose => {
      sqlContent += `INSERT INTO "Dose" ("id", "name", "description", "price", "image", "active", "createdAt", "updatedAt", "categoryId") VALUES (`;
      sqlContent += `'${dose.id}'::uuid, '${dose.name.replace(/'/g, "''")}', `;
      sqlContent += `${dose.description ? `'${dose.description.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${dose.price}, `;
      sqlContent += `${dose.image ? `'${dose.image.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${dose.active}, '${dose.createdAt.toISOString()}'::timestamp, '${dose.updatedAt.toISOString()}'::timestamp, `;
      sqlContent += `${dose.categoryId ? `'${dose.categoryId}'::uuid` : 'NULL'});\n`;
    });
    sqlContent += `\n`;
    
    sqlContent += `-- Inserir DoseItems\n`;
    doseItems.forEach(doseItem => {
      sqlContent += `INSERT INTO "DoseItem" ("id", "doseId", "productId", "quantity", "allowFlavorSelection", "categoryId", "discountBy", "nameFilter", "volumeToDiscount", "createdAt", "updatedAt") VALUES (`;
      sqlContent += `'${doseItem.id}'::uuid, '${doseItem.doseId}'::uuid, '${doseItem.productId}'::uuid, `;
      sqlContent += `${doseItem.quantity}, ${doseItem.allowFlavorSelection}, `;
      sqlContent += `${doseItem.categoryId ? `'${doseItem.categoryId}'::uuid` : 'NULL'}, `;
      sqlContent += `'${doseItem.discountBy}', `;
      sqlContent += `${doseItem.nameFilter ? `'${doseItem.nameFilter.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${doseItem.volumeToDiscount ? doseItem.volumeToDiscount : 'NULL'}, `;
      sqlContent += `'${doseItem.createdAt.toISOString()}'::timestamp, '${doseItem.updatedAt.toISOString()}'::timestamp);\n`;
    });
    sqlContent += `\n`;
    
    sqlContent += `-- Inserir Addresses\n`;
    addresses.forEach(address => {
      sqlContent += `INSERT INTO "Address" ("id", "userId", "title", "street", "number", "complement", "neighborhood", "city", "state", "zipcode", "isDefault", "lat", "lng", "createdAt", "updatedAt") VALUES (`;
      sqlContent += `'${address.id}'::uuid, '${address.userId}'::uuid, '${address.title.replace(/'/g, "''")}', `;
      sqlContent += `'${address.street.replace(/'/g, "''")}', '${address.number.replace(/'/g, "''")}', `;
      sqlContent += `${address.complement ? `'${address.complement.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `'${address.neighborhood.replace(/'/g, "''")}', '${address.city.replace(/'/g, "''")}', `;
      sqlContent += `'${address.state.replace(/'/g, "''")}', '${address.zipcode}', `;
      sqlContent += `${address.isDefault}, `;
      sqlContent += `${address.lat ? address.lat : 'NULL'}, `;
      sqlContent += `${address.lng ? address.lng : 'NULL'}, `;
      sqlContent += `'${address.createdAt.toISOString()}'::timestamp, '${address.updatedAt.toISOString()}'::timestamp);\n`;
    });
    sqlContent += `\n`;
    
    sqlContent += `-- Inserir Orders\n`;
    orders.forEach(order => {
      sqlContent += `INSERT INTO "Order" ("id", "userId", "addressId", "status", "total", "instructions", "deliveryLat", "deliveryLng", "deliveryFee", "createdAt", "updatedAt", "paymentMethodId", "pixPaymentStatus") VALUES (`;
      sqlContent += `'${order.id}'::uuid, '${order.userId}'::uuid, '${order.addressId}'::uuid, '${order.status}', `;
      sqlContent += `${order.total}, `;
      sqlContent += `${order.instructions ? `'${order.instructions.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${order.deliveryLat ? order.deliveryLat : 'NULL'}, `;
      sqlContent += `${order.deliveryLng ? order.deliveryLng : 'NULL'}, `;
      sqlContent += `${order.deliveryFee}, '${order.createdAt.toISOString()}'::timestamp, '${order.updatedAt.toISOString()}'::timestamp, `;
      sqlContent += `${order.paymentMethodId ? `'${order.paymentMethodId}'::uuid` : 'NULL'}, `;
      sqlContent += `${order.pixPaymentStatus ? `'${order.pixPaymentStatus}'` : 'PENDING'});\n`;
    });
    sqlContent += `\n`;
    
    sqlContent += `-- Inserir OrderItems\n`;
    orderItems.forEach(orderItem => {
      sqlContent += `INSERT INTO "OrderItem" ("id", "orderId", "productId", "quantity", "price", "costPrice", "doseId", "comboInstanceId", "doseInstanceId", "choosableSelections") VALUES (`;
      sqlContent += `'${orderItem.id}'::uuid, '${orderItem.orderId}'::uuid, '${orderItem.productId}'::uuid, `;
      sqlContent += `${orderItem.quantity}, ${orderItem.price}, ${orderItem.costPrice}, `;
      sqlContent += `${orderItem.doseId ? `'${orderItem.doseId}'::uuid` : 'NULL'}, `;
      sqlContent += `${orderItem.comboInstanceId ? `'${orderItem.comboInstanceId}'::uuid` : 'NULL'}, `;
      sqlContent += `${orderItem.doseInstanceId ? `'${orderItem.doseInstanceId}'::uuid` : 'NULL'}, `;
      sqlContent += `${orderItem.choosableSelections ? `'${JSON.stringify(orderItem.choosableSelections).replace(/'/g, "''")}'` : 'NULL'});\n`;
    });
    sqlContent += `\n`;
    
    sqlContent += `-- Inserir StockEntries\n`;
    stockEntries.forEach(stockEntry => {
      sqlContent += `INSERT INTO "StockEntry" ("id", "productId", "quantity", "unitCost", "totalCost", "supplierId", "notes", "createdAt") VALUES (`;
      sqlContent += `'${stockEntry.id}'::uuid, '${stockEntry.productId}'::uuid, ${stockEntry.quantity}, `;
      sqlContent += `${stockEntry.unitCost}, ${stockEntry.totalCost}, `;
      sqlContent += `${stockEntry.supplierId ? `'${stockEntry.supplierId}'::uuid` : 'NULL'}, `;
      sqlContent += `${stockEntry.notes ? `'${stockEntry.notes.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `'${stockEntry.createdAt.toISOString()}'::timestamp);\n`;
    });
    sqlContent += `\n`;
    
    sqlContent += `-- Inserir Notifications\n`;
    notifications.forEach(notification => {
      sqlContent += `INSERT INTO "Notification" ("id", "userId", "orderId", "message", "read", "createdAt") VALUES (`;
      sqlContent += `'${notification.id}'::uuid, '${notification.userId}'::uuid, `;
      sqlContent += `${notification.orderId ? `'${notification.orderId}'::uuid` : 'NULL'}, `;
      sqlContent += `'${notification.message.replace(/'/g, "''")}', ${notification.read}, `;
      sqlContent += `'${notification.createdAt.toISOString()}'::timestamp);\n`;
    });
    sqlContent += `\n`;
    
    // Inserir dados das tabelas de vendas e financeiro
    sqlContent += `-- Inserir Clients\n`;
    clients.forEach(client => {
      sqlContent += `INSERT INTO "Client" ("id", "name", "email", "phone", "document", "address", "active", "createdAt", "updatedAt") VALUES (`;
      sqlContent += `'${client.id}'::uuid, '${client.name.replace(/'/g, "''")}', `;
      sqlContent += `${client.email ? `'${client.email.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${client.phone ? `'${client.phone.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${client.document ? `'${client.document.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${client.address ? `'${client.address.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${client.active}, '${client.createdAt.toISOString()}'::timestamp, '${client.updatedAt.toISOString()}'::timestamp);\n`;
    });
    sqlContent += `\n`;
    
    sqlContent += `-- Inserir Sales\n`;
    sales.forEach(sale => {
      sqlContent += `INSERT INTO "Sale" ("id", "status", "total", "discount", "createdAt", "updatedAt", "userId", "clientId", "paymentMethodId") VALUES (`;
      sqlContent += `'${sale.id}'::uuid, '${sale.status}', ${sale.total}, ${sale.discount}, `;
      sqlContent += `'${sale.createdAt.toISOString()}'::timestamp, '${sale.updatedAt.toISOString()}'::timestamp, `;
      sqlContent += `'${sale.userId}'::uuid, `;
      sqlContent += `${sale.clientId ? `'${sale.clientId}'::uuid` : 'NULL'}, `;
      sqlContent += `${sale.paymentMethodId ? `'${sale.paymentMethodId}'::uuid` : 'NULL'});\n`;
    });
    sqlContent += `\n`;
    
    sqlContent += `-- Inserir SaleItems\n`;
    saleItems.forEach(saleItem => {
      sqlContent += `INSERT INTO "SaleItem" ("id", "quantity", "price", "costPrice", "discount", "createdAt", "saleId", "productId", "isDoseItem", "isFractioned", "discountBy", "choosableSelections") VALUES (`;
      sqlContent += `'${saleItem.id}'::uuid, ${saleItem.quantity}, ${saleItem.price}, ${saleItem.costPrice}, ${saleItem.discount}, `;
      sqlContent += `'${saleItem.createdAt.toISOString()}'::timestamp, '${saleItem.saleId}'::uuid, '${saleItem.productId}'::uuid, `;
      sqlContent += `${saleItem.isDoseItem}, ${saleItem.isFractioned}, `;
      sqlContent += `${saleItem.discountBy ? `'${saleItem.discountBy}'` : 'NULL'}, `;
      sqlContent += `${saleItem.choosableSelections ? `'${JSON.stringify(saleItem.choosableSelections).replace(/'/g, "''")}'` : 'NULL'});\n`;
    });
    sqlContent += `\n`;
    
    sqlContent += `-- Inserir CashFlows\n`;
    cashFlows.forEach(cashFlow => {
      sqlContent += `INSERT INTO "CashFlow" ("id", "type", "amount", "description", "createdAt", "userId") VALUES (`;
      sqlContent += `'${cashFlow.id}'::uuid, '${cashFlow.type}', ${cashFlow.amount}, '${cashFlow.description.replace(/'/g, "''")}', `;
      sqlContent += `'${cashFlow.createdAt.toISOString()}'::timestamp, '${cashFlow.userId}'::uuid);\n`;
    });
    sqlContent += `\n`;
    
    sqlContent += `-- Inserir AccountPayables\n`;
    accountPayables.forEach(accountPayable => {
      sqlContent += `INSERT INTO "AccountPayable" ("id", "description", "value", "dueDate", "status", "type", "observations", "createdAt", "updatedAt") VALUES (`;
      sqlContent += `'${accountPayable.id}'::uuid, '${accountPayable.description.replace(/'/g, "''")}', ${accountPayable.value}, `;
      sqlContent += `'${accountPayable.dueDate.toISOString()}'::timestamp, '${accountPayable.status}', '${accountPayable.type}', `;
      sqlContent += `${accountPayable.observations ? `'${accountPayable.observations.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `'${accountPayable.createdAt.toISOString()}'::timestamp, '${accountPayable.updatedAt.toISOString()}'::timestamp);\n`;
    });
    sqlContent += `\n`;
    
    sqlContent += `-- Inserir StockMovements\n`;
    stockMovements.forEach(stockMovement => {
      sqlContent += `INSERT INTO "StockMovement" ("id", "createdAt", "productId", "type", "quantity", "unitCost", "totalCost", "notes", "origin") VALUES (`;
      sqlContent += `'${stockMovement.id}'::uuid, '${stockMovement.createdAt.toISOString()}'::timestamp, '${stockMovement.productId}'::uuid, `;
      sqlContent += `'${stockMovement.type}', ${stockMovement.quantity}, ${stockMovement.unitCost}, ${stockMovement.totalCost}, `;
      sqlContent += `${stockMovement.notes ? `'${stockMovement.notes.replace(/'/g, "''")}'` : 'NULL'}, `;
      sqlContent += `${stockMovement.origin ? `'${stockMovement.origin.replace(/'/g, "''")}'` : 'NULL'});\n`;
    });
    sqlContent += `\n`;
    
    // Reabilitar triggers
    sqlContent += `-- Reabilitar triggers\n`;
    sqlContent += `SET session_replication_role = DEFAULT;\n\n`;
    
    sqlContent += `-- Backup concluído com sucesso!\n`;
    sqlContent += `-- Total de registros exportados:\n`;
    sqlContent += `-- Users: ${users.length}\n`;
    sqlContent += `-- Categories: ${categories.length}\n`;
    sqlContent += `-- Suppliers: ${suppliers.length}\n`;
    sqlContent += `-- PaymentMethods: ${paymentMethods.length}\n`;
    sqlContent += `-- Products: ${products.length}\n`;
    sqlContent += `-- Promotions: ${promotions.length}\n`;
    sqlContent += `-- Combos: ${combos.length}\n`;
    sqlContent += `-- ComboItems: ${comboItems.length}\n`;
    sqlContent += `-- Doses: ${doses.length}\n`;
    sqlContent += `-- DoseItems: ${doseItems.length}\n`;
    sqlContent += `-- Addresses: ${addresses.length}\n`;
    sqlContent += `-- Orders: ${orders.length}\n`;
    sqlContent += `-- OrderItems: ${orderItems.length}\n`;
    sqlContent += `-- StockEntries: ${stockEntries.length}\n`;
    sqlContent += `-- Notifications: ${notifications.length}\n`;
    sqlContent += `-- Clients: ${clients.length}\n`;
    sqlContent += `-- Sales: ${sales.length}\n`;
    sqlContent += `-- SaleItems: ${saleItems.length}\n`;
    sqlContent += `-- CashFlows: ${cashFlows.length}\n`;
    sqlContent += `-- AccountPayables: ${accountPayables.length}\n`;
    sqlContent += `-- StockMovements: ${stockMovements.length}\n`;
    sqlContent += `-- Backup concluído!\n`;

    // Configurar headers para download
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="backup-completo-${new Date().toISOString().split('T')[0]}.sql"`);
    
    res.send(sqlContent);
  } catch (error) {
    console.error('Erro ao gerar backup:', error);
    res.status(500).json({ error: 'Erro ao gerar backup do banco de dados' });
  }
});

// Rota para gerar schema completo das tabelas
router.get('/schema', async (req, res) => {
  try {
    // Gerar schema baseado no Prisma
    let schemaContent = `-- Schema completo do banco de dados - ${new Date().toISOString()}\n`;
    schemaContent += `-- Gerado automaticamente para migração Supabase\n`;
    schemaContent += `-- Compatível com PostgreSQL padrão\n\n`;
    
    // Extensões necessárias
    schemaContent += `-- Extensões necessárias\n`;
    schemaContent += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`;
    
    // Schema das tabelas baseado no Prisma
    schemaContent += `-- ========================================\n`;
    schemaContent += `-- CRIAR TABELAS\n`;
    schemaContent += `-- ========================================\n\n`;
    
    // Tabela User
    schemaContent += `CREATE TABLE "User" (\n`;
    schemaContent += `    "id" SERIAL PRIMARY KEY,\n`;
    schemaContent += `    "name" TEXT NOT NULL,\n`;
    schemaContent += `    "email" TEXT UNIQUE NOT NULL,\n`;
    schemaContent += `    "password" TEXT NOT NULL,\n`;
    schemaContent += `    "phone" TEXT,\n`;
    schemaContent += `    "role" TEXT NOT NULL DEFAULT 'USER',\n`;
    schemaContent += `    "active" BOOLEAN NOT NULL DEFAULT true,\n`;
    schemaContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    schemaContent += `    "updatedAt" TIMESTAMP(3) NOT NULL\n`;
    schemaContent += `);\n\n`;
    
    // Tabela Category
    schemaContent += `CREATE TABLE "Category" (\n`;
    schemaContent += `    "id" SERIAL PRIMARY KEY,\n`;
    schemaContent += `    "name" TEXT NOT NULL,\n`;
    schemaContent += `    "description" TEXT,\n`;
    schemaContent += `    "image" TEXT,\n`;
    schemaContent += `    "active" BOOLEAN NOT NULL DEFAULT true,\n`;
    schemaContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    schemaContent += `    "updatedAt" TIMESTAMP(3) NOT NULL\n`;
    schemaContent += `);\n\n`;
    
    // Tabela Supplier
    schemaContent += `CREATE TABLE "Supplier" (\n`;
    schemaContent += `    "id" SERIAL PRIMARY KEY,\n`;
    schemaContent += `    "name" TEXT NOT NULL,\n`;
    schemaContent += `    "email" TEXT,\n`;
    schemaContent += `    "phone" TEXT,\n`;
    schemaContent += `    "address" TEXT,\n`;
    schemaContent += `    "contactCategory" TEXT,\n`;
    schemaContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    schemaContent += `    "updatedAt" TIMESTAMP(3) NOT NULL\n`;
    schemaContent += `);\n\n`;
    
    // Tabela PaymentMethod
    schemaContent += `CREATE TABLE "PaymentMethod" (\n`;
    schemaContent += `    "id" SERIAL PRIMARY KEY,\n`;
    schemaContent += `    "name" TEXT NOT NULL,\n`;
    schemaContent += `    "active" BOOLEAN NOT NULL DEFAULT true,\n`;
    schemaContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    schemaContent += `    "updatedAt" TIMESTAMP(3) NOT NULL\n`;
    schemaContent += `);\n\n`;
    
    // Tabela Product
    schemaContent += `CREATE TABLE "Product" (\n`;
    schemaContent += `    "id" SERIAL PRIMARY KEY,\n`;
    schemaContent += `    "name" TEXT NOT NULL,\n`;
    schemaContent += `    "description" TEXT,\n`;
    schemaContent += `    "price" DECIMAL(10,2) NOT NULL,\n`;
    schemaContent += `    "originalPrice" DECIMAL(10,2),\n`;
    schemaContent += `    "stock" INTEGER NOT NULL DEFAULT 0,\n`;
    schemaContent += `    "image" TEXT,\n`;
    schemaContent += `    "categoryId" INTEGER,\n`;
    schemaContent += `    "supplierId" INTEGER,\n`;
    schemaContent += `    "active" BOOLEAN NOT NULL DEFAULT true,\n`;
    schemaContent += `    "pinned" BOOLEAN NOT NULL DEFAULT false,\n`;
    schemaContent += `    "margin" DECIMAL(5,2),\n`;
    schemaContent += `    "costPrice" DECIMAL(10,2),\n`;
    schemaContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    schemaContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    schemaContent += `    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL,\n`;
    schemaContent += `    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL\n`;
    schemaContent += `);\n\n`;
    
    // Tabela Promotion
    schemaContent += `CREATE TABLE "Promotion" (\n`;
    schemaContent += `    "id" SERIAL PRIMARY KEY,\n`;
    schemaContent += `    "name" TEXT NOT NULL,\n`;
    schemaContent += `    "description" TEXT,\n`;
    schemaContent += `    "discount" DECIMAL(5,2) NOT NULL,\n`;
    schemaContent += `    "startDate" TIMESTAMP(3) NOT NULL,\n`;
    schemaContent += `    "endDate" TIMESTAMP(3) NOT NULL,\n`;
    schemaContent += `    "image" TEXT,\n`;
    schemaContent += `    "active" BOOLEAN NOT NULL DEFAULT true,\n`;
    schemaContent += `    "categoryId" INTEGER,\n`;
    schemaContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    schemaContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    schemaContent += `    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL\n`;
    schemaContent += `);\n\n`;
    
    // Tabela Combo
    schemaContent += `CREATE TABLE "Combo" (\n`;
    schemaContent += `    "id" SERIAL PRIMARY KEY,\n`;
    schemaContent += `    "name" TEXT NOT NULL,\n`;
    schemaContent += `    "description" TEXT,\n`;
    schemaContent += `    "price" DECIMAL(10,2) NOT NULL,\n`;
    schemaContent += `    "originalPrice" DECIMAL(10,2),\n`;
    schemaContent += `    "image" TEXT,\n`;
    schemaContent += `    "active" BOOLEAN NOT NULL DEFAULT true,\n`;
    schemaContent += `    "categoryId" INTEGER,\n`;
    schemaContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    schemaContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    schemaContent += `    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL\n`;
    schemaContent += `);\n\n`;
    
    // Tabela ComboItem
    schemaContent += `CREATE TABLE "ComboItem" (\n`;
    schemaContent += `    "id" SERIAL PRIMARY KEY,\n`;
    schemaContent += `    "comboId" INTEGER NOT NULL,\n`;
    schemaContent += `    "productId" INTEGER,\n`;
    schemaContent += `    "quantity" INTEGER NOT NULL DEFAULT 1,\n`;
    schemaContent += `    "price" DECIMAL(10,2) NOT NULL,\n`;
    schemaContent += `    "categoryId" INTEGER,\n`;
    schemaContent += `    "nameFilter" TEXT,\n`;
    schemaContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    schemaContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    schemaContent += `    FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE CASCADE,\n`;
    schemaContent += `    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL,\n`;
    schemaContent += `    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL\n`;
    schemaContent += `);\n\n`;
    
    // Tabela Dose
    schemaContent += `CREATE TABLE "Dose" (\n`;
    schemaContent += `    "id" SERIAL PRIMARY KEY,\n`;
    schemaContent += `    "name" TEXT NOT NULL,\n`;
    schemaContent += `    "description" TEXT,\n`;
    schemaContent += `    "price" DECIMAL(10,2) NOT NULL,\n`;
    schemaContent += `    "originalPrice" DECIMAL(10,2),\n`;
    schemaContent += `    "image" TEXT,\n`;
    schemaContent += `    "active" BOOLEAN NOT NULL DEFAULT true,\n`;
    schemaContent += `    "categoryId" INTEGER,\n`;
    schemaContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    schemaContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    schemaContent += `    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL\n`;
    schemaContent += `);\n\n`;
    
    // Tabela DoseItem
    schemaContent += `CREATE TABLE "DoseItem" (\n`;
    schemaContent += `    "id" SERIAL PRIMARY KEY,\n`;
    schemaContent += `    "doseId" INTEGER NOT NULL,\n`;
    schemaContent += `    "productId" INTEGER,\n`;
    schemaContent += `    "quantity" INTEGER NOT NULL DEFAULT 1,\n`;
    schemaContent += `    "price" DECIMAL(10,2) NOT NULL,\n`;
    schemaContent += `    "categoryId" INTEGER,\n`;
    schemaContent += `    "nameFilter" TEXT,\n`;
    schemaContent += `    "allowFlavorSelection" BOOLEAN NOT NULL DEFAULT false,\n`;
    schemaContent += `    "volumeToDiscount" DECIMAL(10,2),\n`;
    schemaContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    schemaContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    schemaContent += `    FOREIGN KEY ("doseId") REFERENCES "Dose"("id") ON DELETE CASCADE,\n`;
    schemaContent += `    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL,\n`;
    schemaContent += `    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL\n`;
    schemaContent += `);\n\n`;
    
    // Tabela Address
    schemaContent += `CREATE TABLE "Address" (\n`;
    schemaContent += `    "id" SERIAL PRIMARY KEY,\n`;
    schemaContent += `    "userId" INTEGER NOT NULL,\n`;
    schemaContent += `    "title" TEXT NOT NULL,\n`;
    schemaContent += `    "street" TEXT NOT NULL,\n`;
    schemaContent += `    "number" TEXT NOT NULL,\n`;
    schemaContent += `    "complement" TEXT,\n`;
    schemaContent += `    "neighborhood" TEXT NOT NULL,\n`;
    schemaContent += `    "city" TEXT NOT NULL,\n`;
    schemaContent += `    "state" TEXT NOT NULL,\n`;
    schemaContent += `    "zipcode" TEXT NOT NULL,\n`;
    schemaContent += `    "lat" DECIMAL(10,8),\n`;
    schemaContent += `    "lng" DECIMAL(11,8),\n`;
    schemaContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    schemaContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    schemaContent += `    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE\n`;
    schemaContent += `);\n\n`;
    
    // Tabela Order
    schemaContent += `CREATE TABLE "Order" (\n`;
    schemaContent += `    "id" SERIAL PRIMARY KEY,\n`;
    schemaContent += `    "userId" INTEGER,\n`;
    schemaContent += `    "addressId" INTEGER,\n`;
    schemaContent += `    "total" DECIMAL(10,2) NOT NULL,\n`;
    schemaContent += `    "status" TEXT NOT NULL DEFAULT 'pending',\n`;
    schemaContent += `    "paymentMethod" TEXT,\n`;
    schemaContent += `    "pixPaymentStatus" TEXT,\n`;
    schemaContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    schemaContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    schemaContent += `    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL,\n`;
    schemaContent += `    FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL\n`;
    schemaContent += `);\n\n`;
    
    // Tabela OrderItem
    schemaContent += `CREATE TABLE "OrderItem" (\n`;
    schemaContent += `    "id" SERIAL PRIMARY KEY,\n`;
    schemaContent += `    "orderId" INTEGER NOT NULL,\n`;
    schemaContent += `    "productId" INTEGER,\n`;
    schemaContent += `    "comboId" INTEGER,\n`;
    schemaContent += `    "doseId" INTEGER,\n`;
    schemaContent += `    "comboInstanceId" TEXT,\n`;
    schemaContent += `    "doseInstanceId" TEXT,\n`;
    schemaContent += `    "quantity" INTEGER NOT NULL,\n`;
    schemaContent += `    "price" DECIMAL(10,2) NOT NULL,\n`;
    schemaContent += `    "soldVolume" DECIMAL(10,2),\n`;
    schemaContent += `    "doseFields" JSONB,\n`;
    schemaContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    schemaContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    schemaContent += `    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE,\n`;
    schemaContent += `    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL,\n`;
    schemaContent += `    FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE SET NULL,\n`;
    schemaContent += `    FOREIGN KEY ("doseId") REFERENCES "Dose"("id") ON DELETE SET NULL\n`;
    schemaContent += `);\n\n`;
    
    // Tabela StockEntry
    schemaContent += `CREATE TABLE "StockEntry" (\n`;
    schemaContent += `    "id" SERIAL PRIMARY KEY,\n`;
    schemaContent += `    "productId" INTEGER NOT NULL,\n`;
    schemaContent += `    "quantity" INTEGER NOT NULL,\n`;
    schemaContent += `    "costPrice" DECIMAL(10,2),\n`;
    schemaContent += `    "type" TEXT NOT NULL DEFAULT 'in',\n`;
    schemaContent += `    "notes" TEXT,\n`;
    schemaContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    schemaContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    schemaContent += `    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE\n`;
    schemaContent += `);\n\n`;
    
    // Tabela Notification
    schemaContent += `CREATE TABLE "Notification" (\n`;
    schemaContent += `    "id" SERIAL PRIMARY KEY,\n`;
    schemaContent += `    "userId" INTEGER NOT NULL,\n`;
    schemaContent += `    "title" TEXT NOT NULL,\n`;
    schemaContent += `    "message" TEXT NOT NULL,\n`;
    schemaContent += `    "type" TEXT NOT NULL DEFAULT 'info',\n`;
    schemaContent += `    "read" BOOLEAN NOT NULL DEFAULT false,\n`;
    schemaContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    schemaContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    schemaContent += `    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE\n`;
    schemaContent += `);\n\n`;
    
    // Tabela CartItem (se existir)
    schemaContent += `CREATE TABLE "CartItem" (\n`;
    schemaContent += `    "id" SERIAL PRIMARY KEY,\n`;
    schemaContent += `    "userId" INTEGER NOT NULL,\n`;
    schemaContent += `    "productId" INTEGER,\n`;
    schemaContent += `    "comboId" INTEGER,\n`;
    schemaContent += `    "doseId" INTEGER,\n`;
    schemaContent += `    "comboInstanceId" TEXT,\n`;
    schemaContent += `    "doseInstanceId" TEXT,\n`;
    schemaContent += `    "quantity" INTEGER NOT NULL DEFAULT 1,\n`;
    schemaContent += `    "price" DECIMAL(10,2) NOT NULL,\n`;
    schemaContent += `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    schemaContent += `    "updatedAt" TIMESTAMP(3) NOT NULL,\n`;
    schemaContent += `    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,\n`;
    schemaContent += `    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE,\n`;
    schemaContent += `    FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE CASCADE,\n`;
    schemaContent += `    FOREIGN KEY ("doseId") REFERENCES "Dose"("id") ON DELETE CASCADE\n`;
    schemaContent += `);\n\n`;
    
    // Índices para melhor performance
    schemaContent += `-- ========================================\n`;
    schemaContent += `-- ÍNDICES PARA PERFORMANCE\n`;
    schemaContent += `-- ========================================\n\n`;
    
    schemaContent += `CREATE INDEX "User_email_idx" ON "User"("email");\n`;
    schemaContent += `CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");\n`;
    schemaContent += `CREATE INDEX "Product_active_idx" ON "Product"("active");\n`;
    schemaContent += `CREATE INDEX "Order_userId_idx" ON "Order"("userId");\n`;
    schemaContent += `CREATE INDEX "Order_status_idx" ON "Order"("status");\n`;
    schemaContent += `CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");\n`;
    schemaContent += `CREATE INDEX "Address_userId_idx" ON "Address"("userId");\n`;
    schemaContent += `CREATE INDEX "ComboItem_comboId_idx" ON "ComboItem"("comboId");\n`;
    schemaContent += `CREATE INDEX "DoseItem_doseId_idx" ON "DoseItem"("doseId");\n`;
    schemaContent += `CREATE INDEX "StockEntry_productId_idx" ON "StockEntry"("productId");\n`;
    schemaContent += `CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");\n`;
    schemaContent += `CREATE INDEX "CartItem_userId_idx" ON "CartItem"("userId");\n\n`;
    
    // Comentário final
    schemaContent += `-- Schema criado com sucesso!\n`;
    schemaContent += `-- Execute este arquivo no Supabase antes de importar os dados\n`;

    // Configurar headers para download
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="schema-completo-${new Date().toISOString().split('T')[0]}.sql"`);
    
    res.send(schemaContent);
  } catch (error) {
    console.error('Erro ao gerar schema:', error);
    res.status(500).json({ error: 'Erro ao gerar schema do banco de dados' });
  }
});

// Rotas de ofertas
router.get('/offers', offerController.getAll);
router.get('/offers/:id', offerController.getById);
router.post('/offers', upload.single('image'), offerController.create);
router.put('/offers/:id', upload.single('image'), offerController.update);
router.delete('/offers/:id', offerController.remove);
router.patch('/offers/:id/active', offerController.toggleActive);

// Rota para totais de custo e venda do estoque
router.get('/estoque-totals', adminController.getEstoqueTotals);

// Rota para vendas do dia (PDV e online)
router.get('/vendas-hoje', adminController.getVendasHoje);

router.post('/comandas/:comandaId/items/combo', comandaController.addComboItems);

export default router; 