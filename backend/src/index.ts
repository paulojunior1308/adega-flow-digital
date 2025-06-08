import express from 'express';
import cors from 'cors';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import paymentMethodRoutes from './routes/payment-method.routes';
import doseRoutes from './routes/dose.routes';
import saleRoutes from './routes/sale.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use('/admin/products', productRoutes);
app.use('/admin/categories', categoryRoutes);
app.use('/admin/payment-methods', paymentMethodRoutes);
app.use('/admin/doses', doseRoutes);
app.use('/admin/sales', saleRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 