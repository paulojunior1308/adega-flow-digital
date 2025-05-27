import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {

  // Log das tabelas existentes
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  console.log('Tabelas existentes no banco:', tables.map(t => t.table_name));

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

  await prisma.category.deleteMany({});
  console.log('Categorias removidas com sucesso!');


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