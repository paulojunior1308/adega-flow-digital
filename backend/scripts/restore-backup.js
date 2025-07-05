const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Script para restaurar backup no Supabase
// Uso: node scripts/restore-backup.js backup-file.json

const prisma = new PrismaClient();

async function restoreBackup(backupFile) {
  try {
    console.log('🔄 Iniciando restauração do backup...');
    
    // Ler arquivo de backup
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    console.log(`📁 Backup carregado: ${backupFile}`);
    console.log(`📅 Data do backup: ${backupData.createdAt}`);
    
    // Limpar dados existentes (cuidado!)
    console.log('🧹 Limpando dados existentes...');
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.stockEntry.deleteMany();
    await prisma.comboItem.deleteMany();
    await prisma.combo.deleteMany();
    await prisma.doseItem.deleteMany();
    await prisma.dose.deleteMany();
    await prisma.promotion.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.paymentMethod.deleteMany();
    await prisma.address.deleteMany();
    await prisma.user.deleteMany();
    await prisma.notification.deleteMany();
    
    console.log('✅ Dados limpos com sucesso');
    
    // Restaurar dados na ordem correta (respeitando foreign keys)
    
    // 1. Categorias
    if (backupData.categories && backupData.categories.length > 0) {
      console.log('📂 Restaurando categorias...');
      for (const category of backupData.categories) {
        await prisma.category.create({
          data: {
            id: category.id,
            name: category.name,
            description: category.description,
            image: category.image,
            active: category.active,
            createdAt: new Date(category.createdAt),
            updatedAt: new Date(category.updatedAt)
          }
        });
      }
      console.log(`✅ ${backupData.categories.length} categorias restauradas`);
    }
    
    // 2. Fornecedores
    if (backupData.suppliers && backupData.suppliers.length > 0) {
      console.log('🏢 Restaurando fornecedores...');
      for (const supplier of backupData.suppliers) {
        await prisma.supplier.create({
          data: {
            id: supplier.id,
            name: supplier.name,
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.address,
            contactCategory: supplier.contactCategory,
            createdAt: new Date(supplier.createdAt),
            updatedAt: new Date(supplier.updatedAt)
          }
        });
      }
      console.log(`✅ ${backupData.suppliers.length} fornecedores restaurados`);
    }
    
    // 3. Métodos de pagamento
    if (backupData.paymentMethods && backupData.paymentMethods.length > 0) {
      console.log('💳 Restaurando métodos de pagamento...');
      for (const paymentMethod of backupData.paymentMethods) {
        await prisma.paymentMethod.create({
          data: {
            id: paymentMethod.id,
            name: paymentMethod.name,
            active: paymentMethod.active,
            createdAt: new Date(paymentMethod.createdAt),
            updatedAt: new Date(paymentMethod.updatedAt)
          }
        });
      }
      console.log(`✅ ${backupData.paymentMethods.length} métodos de pagamento restaurados`);
    }
    
    // 4. Usuários
    if (backupData.users && backupData.users.length > 0) {
      console.log('👥 Restaurando usuários...');
      for (const user of backupData.users) {
        await prisma.user.create({
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
            phone: user.phone,
            role: user.role,
            active: user.active,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          }
        });
      }
      console.log(`✅ ${backupData.users.length} usuários restaurados`);
    }
    
    // 5. Endereços
    if (backupData.users && backupData.users.length > 0) {
      console.log('📍 Restaurando endereços...');
      for (const user of backupData.users) {
        if (user.addresses && user.addresses.length > 0) {
          for (const address of user.addresses) {
            await prisma.address.create({
              data: {
                id: address.id,
                userId: address.userId,
                title: address.title,
                street: address.street,
                number: address.number,
                complement: address.complement,
                neighborhood: address.neighborhood,
                city: address.city,
                state: address.state,
                zipcode: address.zipcode,
                lat: address.lat,
                lng: address.lng,
                createdAt: new Date(address.createdAt),
                updatedAt: new Date(address.updatedAt)
              }
            });
          }
        }
      }
      console.log('✅ Endereços restaurados');
    }
    
    // 6. Produtos
    if (backupData.products && backupData.products.length > 0) {
      console.log('📦 Restaurando produtos...');
      for (const product of backupData.products) {
        await prisma.product.create({
          data: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            originalPrice: product.originalPrice,
            stock: product.stock,
            image: product.image,
            categoryId: product.categoryId,
            supplierId: product.supplierId,
            active: product.active,
            pinned: product.pinned,
            margin: product.margin,
            costPrice: product.costPrice,
            createdAt: new Date(product.createdAt),
            updatedAt: new Date(product.updatedAt)
          }
        });
      }
      console.log(`✅ ${backupData.products.length} produtos restaurados`);
    }
    
    // 7. Promoções
    if (backupData.promotions && backupData.promotions.length > 0) {
      console.log('🎉 Restaurando promoções...');
      for (const promotion of backupData.promotions) {
        await prisma.promotion.create({
          data: {
            id: promotion.id,
            name: promotion.name,
            description: promotion.description,
            discount: promotion.discount,
            startDate: new Date(promotion.startDate),
            endDate: new Date(promotion.endDate),
            image: promotion.image,
            active: promotion.active,
            categoryId: promotion.categoryId,
            createdAt: new Date(promotion.createdAt),
            updatedAt: new Date(promotion.updatedAt)
          }
        });
      }
      console.log(`✅ ${backupData.promotions.length} promoções restauradas`);
    }
    
    // 8. Combos
    if (backupData.combos && backupData.combos.length > 0) {
      console.log('🎁 Restaurando combos...');
      for (const combo of backupData.combos) {
        await prisma.combo.create({
          data: {
            id: combo.id,
            name: combo.name,
            description: combo.description,
            price: combo.price,
            originalPrice: combo.originalPrice,
            image: combo.image,
            active: combo.active,
            categoryId: combo.categoryId,
            createdAt: new Date(combo.createdAt),
            updatedAt: new Date(combo.updatedAt)
          }
        });
        
        // Restaurar itens do combo
        if (combo.items && combo.items.length > 0) {
          for (const item of combo.items) {
            await prisma.comboItem.create({
              data: {
                id: item.id,
                comboId: combo.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                categoryId: item.categoryId,
                nameFilter: item.nameFilter,
                createdAt: new Date(item.createdAt),
                updatedAt: new Date(item.updatedAt)
              }
            });
          }
        }
      }
      console.log(`✅ ${backupData.combos.length} combos restaurados`);
    }
    
    // 9. Doses
    if (backupData.doses && backupData.doses.length > 0) {
      console.log('🥃 Restaurando doses...');
      for (const dose of backupData.doses) {
        await prisma.dose.create({
          data: {
            id: dose.id,
            name: dose.name,
            description: dose.description,
            price: dose.price,
            originalPrice: dose.originalPrice,
            image: dose.image,
            active: dose.active,
            categoryId: dose.categoryId,
            createdAt: new Date(dose.createdAt),
            updatedAt: new Date(dose.updatedAt)
          }
        });
        
        // Restaurar itens da dose
        if (dose.items && dose.items.length > 0) {
          for (const item of dose.items) {
            await prisma.doseItem.create({
              data: {
                id: item.id,
                doseId: dose.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                categoryId: item.categoryId,
                nameFilter: item.nameFilter,
                allowFlavorSelection: item.allowFlavorSelection,
                volumeToDiscount: item.volumeToDiscount,
                createdAt: new Date(item.createdAt),
                updatedAt: new Date(item.updatedAt)
              }
            });
          }
        }
      }
      console.log(`✅ ${backupData.doses.length} doses restauradas`);
    }
    
    // 10. Entradas de estoque
    if (backupData.stockEntries && backupData.stockEntries.length > 0) {
      console.log('📊 Restaurando entradas de estoque...');
      for (const entry of backupData.stockEntries) {
        await prisma.stockEntry.create({
          data: {
            id: entry.id,
            productId: entry.productId,
            quantity: entry.quantity,
            costPrice: entry.costPrice,
            type: entry.type,
            notes: entry.notes,
            createdAt: new Date(entry.createdAt),
            updatedAt: new Date(entry.updatedAt)
          }
        });
      }
      console.log(`✅ ${backupData.stockEntries.length} entradas de estoque restauradas`);
    }
    
    // 11. Pedidos
    if (backupData.orders && backupData.orders.length > 0) {
      console.log('📋 Restaurando pedidos...');
      for (const order of backupData.orders) {
        await prisma.order.create({
          data: {
            id: order.id,
            userId: order.userId,
            addressId: order.addressId,
            total: order.total,
            status: order.status,
            paymentMethod: order.paymentMethod,
            pixPaymentStatus: order.pixPaymentStatus,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt)
          }
        });
        
        // Restaurar itens do pedido
        if (order.items && order.items.length > 0) {
          for (const item of order.items) {
            await prisma.orderItem.create({
              data: {
                id: item.id,
                orderId: order.id,
                productId: item.productId,
                comboId: item.comboId,
                doseId: item.doseId,
                comboInstanceId: item.comboInstanceId,
                doseInstanceId: item.doseInstanceId,
                quantity: item.quantity,
                price: item.price,
                soldVolume: item.soldVolume,
                doseFields: item.doseFields,
                createdAt: new Date(item.createdAt),
                updatedAt: new Date(item.updatedAt)
              }
            });
          }
        }
      }
      console.log(`✅ ${backupData.orders.length} pedidos restaurados`);
    }
    
    // 12. Notificações
    if (backupData.notifications && backupData.notifications.length > 0) {
      console.log('🔔 Restaurando notificações...');
      for (const notification of backupData.notifications) {
        await prisma.notification.create({
          data: {
            id: notification.id,
            userId: notification.userId,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            read: notification.read,
            createdAt: new Date(notification.createdAt),
            updatedAt: new Date(notification.updatedAt)
          }
        });
      }
      console.log(`✅ ${backupData.notifications.length} notificações restauradas`);
    }
    
    console.log('🎉 Restauração concluída com sucesso!');
    console.log('📝 Resumo:');
    console.log(`   - Categorias: ${backupData.categories?.length || 0}`);
    console.log(`   - Fornecedores: ${backupData.suppliers?.length || 0}`);
    console.log(`   - Métodos de pagamento: ${backupData.paymentMethods?.length || 0}`);
    console.log(`   - Usuários: ${backupData.users?.length || 0}`);
    console.log(`   - Produtos: ${backupData.products?.length || 0}`);
    console.log(`   - Promoções: ${backupData.promotions?.length || 0}`);
    console.log(`   - Combos: ${backupData.combos?.length || 0}`);
    console.log(`   - Doses: ${backupData.doses?.length || 0}`);
    console.log(`   - Entradas de estoque: ${backupData.stockEntries?.length || 0}`);
    console.log(`   - Pedidos: ${backupData.orders?.length || 0}`);
    console.log(`   - Notificações: ${backupData.notifications?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Erro durante a restauração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
const backupFile = process.argv[2];

if (!backupFile) {
  console.error('❌ Uso: node scripts/restore-backup.js backup-file.json');
  process.exit(1);
}

if (!fs.existsSync(backupFile)) {
  console.error(`❌ Arquivo de backup não encontrado: ${backupFile}`);
  process.exit(1);
}

restoreBackup(backupFile)
  .then(() => {
    console.log('✅ Script executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro no script:', error);
    process.exit(1);
  }); 