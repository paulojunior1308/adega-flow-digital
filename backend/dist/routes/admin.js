"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const role_1 = require("../middlewares/role");
const admin_1 = require("../controllers/admin");
const order_1 = require("../controllers/order");
const product_1 = require("../controllers/product");
const prisma_1 = __importDefault(require("../config/prisma"));
const promotion_1 = require("../controllers/promotion");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const combo_1 = require("../controllers/combo");
const supplier_1 = require("../controllers/supplier");
const paymentMethod_1 = require("../controllers/paymentMethod");
const finance_1 = require("../controllers/finance");
const stockEntry_1 = require("../controllers/stockEntry");
const category_1 = require("../controllers/category");
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage });
router.post('/login', admin_1.adminController.login);
router.use(auth_1.authMiddleware, auth_1.adminMiddleware);
router.use((0, role_1.authorizeRoles)('ADMIN'));
router.get('/dashboard', admin_1.adminController.dashboard);
router.post('/users', admin_1.adminController.createUser);
router.get('/users', admin_1.adminController.getUsers);
router.put('/users/:id', admin_1.adminController.updateUser);
router.delete('/users/:id', admin_1.adminController.deleteUser);
router.get('/orders', order_1.orderController.adminList);
router.patch('/orders/:id/status', order_1.orderController.updateStatus);
router.patch('/orders/:id/location', order_1.orderController.updateLocation);
router.patch('/orders/:id/pix-status', order_1.orderController.updatePixStatus);
router.get('/products', product_1.productController.list);
router.get('/products/categories', product_1.productController.listCategories);
router.post('/products', product_1.productController.create);
router.put('/products/:id', product_1.productController.update);
router.delete('/products/:id', product_1.productController.delete);
router.patch('/products/:id/pinned', product_1.productController.updatePinned);
router.put('/products/:id/stock', product_1.productController.updateStock);
router.get('/combos', combo_1.comboController.list);
router.post('/combos', upload.single('image'), combo_1.comboController.create);
router.put('/combos/:id', upload.single('image'), combo_1.comboController.update);
router.delete('/combos/:id', combo_1.comboController.delete);
router.patch('/combos/:id/active', combo_1.comboController.updateActive);
router.get('/products/promos-combos', product_1.productController.listPromosCombos);
router.patch('/products/:id/promos-combos', product_1.productController.updatePromosCombos);
router.get('/promotions', promotion_1.promotionController.list);
router.post('/promotions', upload.single('image'), promotion_1.promotionController.create);
router.put('/promotions/:id', upload.single('image'), promotion_1.promotionController.update);
router.delete('/promotions/:id', promotion_1.promotionController.delete);
router.patch('/promotions/:id/active', async (req, res) => {
    const { id } = req.params;
    const { active } = req.body;
    try {
        const promotion = await prisma_1.default.promotion.update({
            where: { id },
            data: { active: Boolean(active) },
        });
        res.json(promotion);
    }
    catch (error) {
        res.status(404).json({ error: 'Promoção não encontrada' });
    }
});
router.get('/categories', category_1.categoryController.list);
router.get('/categories/:id', category_1.categoryController.get);
router.post('/categories', category_1.categoryController.create);
router.put('/categories/:id', category_1.categoryController.update);
router.delete('/categories/:id', category_1.categoryController.delete);
router.patch('/categories/:id/active', category_1.categoryController.updateActive);
router.get('/suppliers', supplier_1.supplierController.list);
router.post('/suppliers', supplier_1.supplierController.create);
router.get('/suppliers/:id', supplier_1.supplierController.get);
router.put('/suppliers/:id', supplier_1.supplierController.update);
router.delete('/suppliers/:id', supplier_1.supplierController.delete);
router.get('/payment-methods', paymentMethod_1.paymentMethodController.list);
router.post('/payment-methods', paymentMethod_1.paymentMethodController.create);
router.get('/payment-methods/:id', paymentMethod_1.paymentMethodController.get);
router.put('/payment-methods/:id', paymentMethod_1.paymentMethodController.update);
router.delete('/payment-methods/:id', paymentMethod_1.paymentMethodController.delete);
router.post('/pdv-sales', admin_1.adminController.createPDVSale);
router.get('/pdv-sales', admin_1.adminController.getPDVSales);
router.get('/finance/report', finance_1.financeController.report);
router.post('/stock-entries', stockEntry_1.stockEntryController.create);
router.get('/stock-entries', stockEntry_1.stockEntryController.list);
exports.default = router;
