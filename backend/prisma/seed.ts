import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {

  // Adicionar usuário admin
  await prisma.user.upsert({
    where: { email: 'pauloesjr2@gmail.com' },
    update: {},
    create: {
      email: 'pauloesjr2@gmail.com',
      password: await bcrypt.hash('Paulo1308**', 10),
      name: 'Paulo Junior',
      role: Role.ADMIN,
      active: true,
    },
  });

  // Adicionar categorias
  const categorias = [
    'Whisky',
    'Essências',
    'GIN',
    'Energéticos',
    'Cervejas',
    'Refrigerantes',
    'Gelo de Coco',
    'Sucos',
    'Carvão',
  ];
  for (const name of categorias) {
    await prisma.category.create({
      data: { name },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export {}; 