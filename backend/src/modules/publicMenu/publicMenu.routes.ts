import { Router } from 'express';
import { publicMenuController } from './publicMenu.controller';

const router = Router();

// Página pública do cardápio (HTML visual)
router.get('/cardapio-publico', publicMenuController.getPublicMenuPage);

// PDF visual do cardápio
router.get('/cardapio-publico/pdf', publicMenuController.getPublicMenuPdf);

// Proxy de imagens para contornar CSP (Cloudinary -> same-origin)
router.get('/cardapio-publico/image-proxy', publicMenuController.getPublicMenuImageProxy);

export default router;

