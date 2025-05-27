import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {

  // Log das tabelas existentes
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  console.log('Tabelas existentes no banco:', tables.map(t => t.table_name));

  // Apagar todas as tabelas do banco (exceto _prisma_migrations)
await prisma.$executeRawUnsafe(`
  DO $$ DECLARE
    r RECORD;
  BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations') LOOP
      EXECUTE 'TRUNCATE TABLE \"' || r.tablename || '\" CASCADE;';
    END LOOP;
  END $$;
`);
console.log('Tabelas apagadas com sucesso!');

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
/*  const categorias = [
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
  console.log('Categorias adicionadas com sucesso!'+ prisma.category.findMany());*/
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