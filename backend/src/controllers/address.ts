import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../config/errorHandler';

export const addressController = {
  // Listar endereços do usuário logado
  list: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
    res.json(addresses);
  },

  // Criar novo endereço
  create: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const { title, street, number, complement, neighborhood, city, state, zipcode, isDefault, lat, lng } = req.body;

    if (isDefault) {
      // Desmarcar outros endereços como default
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        title,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipcode,
        isDefault: !!isDefault,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
      },
    });
    res.status(201).json(address);
  },

  // Editar endereço
  update: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;
    const { title, street, number, complement, neighborhood, city, state, zipcode, isDefault } = req.body;

    const address = await prisma.address.findUnique({ where: { id } });
    if (!address || address.userId !== userId) {
      throw new AppError('Endereço não encontrado', 404);
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        title,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipcode,
        isDefault: !!isDefault,
      },
    });
    res.json(updated);
  },

  // Remover endereço
  remove: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;
    const address = await prisma.address.findUnique({ where: { id } });
    if (!address || address.userId !== userId) {
      throw new AppError('Endereço não encontrado', 404);
    }
    await prisma.address.delete({ where: { id } });
    res.json({ message: 'Endereço removido com sucesso' });
  },
}; 