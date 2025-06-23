import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const categoryController = {
  // Listar todas as categorias
  async list(req: Request, res: Response) {
    try {
      const { active } = req.query;
      
      const where: any = {};
      if (active !== undefined) {
        where.active = active === 'true';
      }

      const categories = await prisma.category.findMany({
        where,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { products: true }
          }
        }
      });

      console.log('Categorias retornadas do banco (com todos os campos):');
      categories.forEach(cat => {
        console.log(JSON.stringify(cat));
      });

      res.json(categories);
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Buscar categoria por ID
  async get(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          products: {
            where: { active: true },
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              image: true
            }
          },
          _count: {
            select: { products: true }
          }
        }
      });

      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      // Garantir que _count sempre exista
      const categoryWithCount = {
        ...category,
        _count: category._count || { products: 0 }
      };

      res.json(categoryWithCount);
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Criar nova categoria
  async create(req: Request, res: Response) {
    try {
      const { name, description, active = true } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
      }

      // Verificar se já existe uma categoria com o mesmo nome
      const existingCategory = await prisma.category.findFirst({
        where: { name: { equals: name.trim(), mode: 'insensitive' } }
      });

      if (existingCategory) {
        return res.status(400).json({ error: 'Já existe uma categoria com este nome' });
      }

      const category = await prisma.category.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          active: Boolean(active)
        }
      });

      res.status(201).json(category);
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Atualizar categoria
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, active } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
      }

      // Verificar se a categoria existe
      const existingCategory = await prisma.category.findUnique({
        where: { id }
      });

      if (!existingCategory) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      // Verificar se já existe outra categoria com o mesmo nome
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          name: { equals: name.trim(), mode: 'insensitive' },
          id: { not: id }
        }
      });

      if (duplicateCategory) {
        return res.status(400).json({ error: 'Já existe uma categoria com este nome' });
      }

      const category = await prisma.category.update({
        where: { id },
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          active: active !== undefined ? Boolean(active) : undefined
        }
      });

      res.json(category);
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Deletar categoria
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Verificar se a categoria existe
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });

      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      // Verificar se há produtos associados
      const productCount = category._count?.products || 0;
      if (productCount > 0) {
        return res.status(400).json({ 
          error: 'Não é possível deletar uma categoria que possui produtos associados',
          productCount
        });
      }

      await prisma.category.delete({
        where: { id }
      });

      res.json({ message: 'Categoria deletada com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Atualizar status ativo/inativo
  async updateActive(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { active } = req.body;

      console.log(`Recebido PATCH para categoria ${id} com active=${active}`);

      const category = await prisma.category.update({
        where: { id },
        data: { active: Boolean(active) }
      });

      console.log('Categoria atualizada:', category);

      res.json(category);
    } catch (error) {
      console.error('Erro ao atualizar status da categoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}; 