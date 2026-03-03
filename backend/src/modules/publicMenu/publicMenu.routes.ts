import { Router } from 'express';
import { publicMenuController } from './publicMenu.controller';

const router = Router();

// Página pública do cardápio (HTML visual)
router.get('/cardapio-publico', publicMenuController.getPublicMenuPage);

// PDF visual do cardápio
router.get('/cardapio-publico/pdf', publicMenuController.getPublicMenuPdf);

export default router;

