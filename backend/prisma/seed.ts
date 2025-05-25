import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as process from 'process';

const prisma = new PrismaClient();

async function main() {
  // Apagar todas as tabelas do banco
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations';
  `;
  for (const { tablename } of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
  }
  console.log('Tabelas apagadas com sucesso!');

  // Log das tabelas existentes
  const tablesExist = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  console.log('Tabelas existentes no banco:', tablesExist.map(t => t.table_name));

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
      data: { name, active: true },
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