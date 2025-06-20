import prisma from '../config/prisma';

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
    console.error('💥 Erro geral no script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script se for chamado diretamente
if (require.main === module) {
  updateProductMargins();
}

export default updateProductMargins; 