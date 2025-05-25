import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Adicionar usuário motoboy genérico
  await prisma.user.upsert({
    where: { email: 'motoboy@teste.com' },
    update: {},
    create: {
      email: 'motoboy@teste.com',
      password: await bcrypt.hash('123456', 10),
      name: 'Motoboy Teste',
      role: Role.MOTOBOY,
      active: true,
    },
  });
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