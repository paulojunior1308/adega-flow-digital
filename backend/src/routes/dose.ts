import { Router } from 'express';
import { doseController } from '../controllers/dose';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Listar todas as doses
router.get('/', doseController.list);

// Criar uma nova dose
router.post('/', doseController.create);

// Atualizar uma dose existente
router.put('/:id', doseController.update);

// Remover uma dose
router.delete('/:id', doseController.delete);

export default router; 