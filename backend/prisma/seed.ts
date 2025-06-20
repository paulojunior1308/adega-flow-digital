import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Função para atualizar margens dos produtos
async function updateProductMargins() {
  try {
    console.log('🚀 Iniciando atualização das margens dos produtos...');
    
    // Usar query SQL direta para evitar problemas de tipos
    const products = await prisma.$queryRaw`
      SELECT id, name, price, "costPrice", margin 
      FROM "Product" 
      WHERE price > 0 
        AND "costPrice" > 0 
        AND margin IS NULL
    `;

    console.log(`📊 Encontrados ${(products as any[]).length} produtos para atualizar`);

    if ((products as any[]).length === 0) {
      console.log('✅ Nenhum produto precisa ser atualizado. Todos já têm margem definida!');
      return;
    }

    let updatedCount = 0;
    let errorCount = 0;

    for (const product of products as any[]) {
      try {
        // Calcular a margem: margem = ((preço / custo) - 1) * 100
        const margin = ((product.price / product.costPrice) - 1) * 100;
        const roundedMargin = Math.round(margin * 100) / 100; // Arredondar para 2 casas decimais
        
        // Atualizar o produto com a margem calculada usando SQL direto
        await prisma.$executeRaw`
          UPDATE "Product" 
          SET margin = ${roundedMargin} 
          WHERE id = ${product.id}
        `;

        console.log(`✅ ${product.name}: ${product.price} / ${product.costPrice} = ${roundedMargin}%`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Erro ao atualizar ${product.name}:`, error);
        errorCount++;
      }
    }

    console.log('\n📈 Resumo da atualização:');
    console.log(`✅ Produtos atualizados: ${updatedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📊 Total processado: ${(products as any[]).length}`);

    if (errorCount === 0) {
      console.log('\n🎉 Todas as margens foram atualizadas com sucesso!');
    } else {
      console.log('\n⚠️  Alguns produtos não puderam ser atualizados. Verifique os erros acima.');
    }

  } catch (error) {
    console.error('💥 Erro geral na atualização de margens:', error);
  }
}

// Função para preencher costPrice dos itens existentes
async function fillCostPriceData() {
  try {
    console.log('🚀 Iniciando preenchimento dos dados de costPrice...');
    
    // Preencher SaleItem com costPrice nulo
    const saleItemsToUpdate = await prisma.$queryRaw`
      SELECT si.id, si."productId", p."costPrice", p.name as "productName"
      FROM "SaleItem" si
      JOIN "Product" p ON si."productId" = p.id
      WHERE si."costPrice" IS NULL
    `;

    console.log(`📊 Encontrados ${(saleItemsToUpdate as any[]).length} itens de venda para atualizar`);

    let updatedSaleItems = 0;
    for (const item of saleItemsToUpdate as any[]) {
      try {
        await prisma.$executeRaw`
          UPDATE "SaleItem" 
          SET "costPrice" = ${item.costPrice} 
          WHERE id = ${item.id}
        `;
        console.log(`✅ SaleItem ${item.productName}: costPrice = ${item.costPrice}`);
        updatedSaleItems++;
      } catch (error) {
        console.error(`❌ Erro ao atualizar SaleItem ${item.productName}:`, error);
      }
    }

    // Preencher OrderItem com costPrice nulo
    const orderItemsToUpdate = await prisma.$queryRaw`
      SELECT oi.id, oi."productId", p."costPrice", p.name as "productName"
      FROM "OrderItem" oi
      JOIN "Product" p ON oi."productId" = p.id
      WHERE oi."costPrice" IS NULL
    `;

    console.log(`📊 Encontrados ${(orderItemsToUpdate as any[]).length} itens de pedido para atualizar`);

    let updatedOrderItems = 0;
    for (const item of orderItemsToUpdate as any[]) {
      try {
        await prisma.$executeRaw`
          UPDATE "OrderItem" 
          SET "costPrice" = ${item.costPrice} 
          WHERE id = ${item.id}
        `;
        console.log(`✅ OrderItem ${item.productName}: costPrice = ${item.costPrice}`);
        updatedOrderItems++;
      } catch (error) {
        console.error(`❌ Erro ao atualizar OrderItem ${item.productName}:`, error);
      }
    }

    console.log('\n📈 Resumo da atualização de costPrice:');
    console.log(`✅ SaleItems atualizados: ${updatedSaleItems}`);
    console.log(`✅ OrderItems atualizados: ${updatedOrderItems}`);
    console.log(`📊 Total processado: ${updatedSaleItems + updatedOrderItems}`);

    if (updatedSaleItems + updatedOrderItems > 0) {
      console.log('\n🎉 Todos os costPrice foram preenchidos com sucesso!');
    } else {
      console.log('\n✅ Nenhum registro precisava ser atualizado.');
    }

  } catch (error) {
    console.error('💥 Erro geral no preenchimento de costPrice:', error);
  }
}

async function main() {

  // Log das tabelas existentes
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  console.log('Tabelas existentes no banco:', tables.map(t => t.table_name));

/*  // Apagar todas as tabelas do banco (exceto _prisma_migrations)
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
      cpf: '45032534846',
      role: Role.ADMIN,
      active: true,
    },
  });

  // Adicionar categorias
  const categorias = [
    'Refrigerantes',
    'Energéticos',
    'GIN',
    'Vinhos',
    'Drinks',
    'Gelos',
    'Cervejas',
    'Whiskys',
    'Descartáveis',
    'Doses',
    'Combos',
    'Salgadinhos',
    'Churrasco',
    'Essências',
    'Carvão',
    'Alumínio',
    'Cigarros',
    'Destilados'
    
  ];
  for (const name of categorias) {
    await prisma.category.create({
      data: { name, active: true },
    });
  }
  console.log('Categorias adicionadas com sucesso!'+ prisma.category.findMany());
*/
  // Preencher costPrice dos itens existentes (se necessário)
  await fillCostPriceData();

  // Atualizar margens dos produtos (se necessário)
  await updateProductMargins();

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