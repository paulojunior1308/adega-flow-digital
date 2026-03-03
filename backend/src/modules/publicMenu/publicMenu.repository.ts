import prisma from '../../config/prisma';

export interface PublicMenuProductRecord {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  categoryId: string;
}

export interface PublicMenuCategoryRecord {
  id: string;
  name: string;
  publicMenuOrder: number;
  products: PublicMenuProductRecord[];
}

export async function getPublicMenuCategoriesWithProducts(): Promise<PublicMenuCategoryRecord[]> {
  const categories = await prisma.category.findMany({
    where: {
      active: true,
      products: {
        some: {
          active: true,
          visibleInPublicMenu: true,
        },
      },
    },
    orderBy: [
      { publicMenuOrder: 'asc' },
      { name: 'asc' },
    ],
    include: {
      products: {
        where: {
          active: true,
          visibleInPublicMenu: true,
        },
        orderBy: {
          name: 'asc',
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          image: true,
          categoryId: true,
        },
      },
    },
  });

  return categories as unknown as PublicMenuCategoryRecord[];
}

