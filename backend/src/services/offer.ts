import prisma from '../config/prisma';

export const getAll = async () => {
  return prisma.offer.findMany({
    include: {
      items: { include: { product: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getById = async (id: string) => {
  return prisma.offer.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } }
    }
  });
};

export const create = async (data: any) => {
  const { name, description, price, image, items } = data;
  const offer = await prisma.offer.create({
    data: {
      name,
      description,
      price,
      image,
      items: {
        create: items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      }
    },
    include: {
      items: { include: { product: true } }
    }
  });
  return offer;
};

export const update = async (id: string, data: any) => {
  const { name, description, price, image, items, active } = data;
  // Remove itens antigos e recria
  await prisma.offerItem.deleteMany({ where: { offerId: id } });
  const offer = await prisma.offer.update({
    where: { id },
    data: {
      name,
      description,
      price,
      image,
      active,
      items: {
        create: items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      }
    },
    include: {
      items: { include: { product: true } }
    }
  });
  return offer;
};

export const remove = async (id: string) => {
  await prisma.offerItem.deleteMany({ where: { offerId: id } });
  await prisma.offer.delete({ where: { id } });
};

export const toggleActive = async (id: string) => {
  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) throw new Error('Oferta não encontrada');
  return prisma.offer.update({
    where: { id },
    data: { active: !offer.active },
    include: {
      items: { include: { product: true } }
    }
  });
}; 