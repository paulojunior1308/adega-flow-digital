import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../config/errorHandler';
import { getSocketInstance } from '../config/socketInstance';
import { PrismaClient, OrderStatus, PixPaymentStatus, OrderItem } from '@prisma/client';
import { updateProductStockStatusWithValues } from '../utils/stockStatus';

type OrderItemWithDose = OrderItem & {
  doseId?: string;
  choosableSelections?: Record<string, Record<string, number>>;
};

// Coordenadas fixas da loja
const STORE_LOCATION = {
  lat: -23.75516809248333,
  lng: -46.69815114446251
};

// Função para calcular distância entre dois pontos (Haversine)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Função para calcular taxa de entrega
function calculateDeliveryFee(distanceKm: number) {
  if (distanceKm <= 2) return 3;
  return 3 + (distanceKm - 2) * 1.5;
}

export const orderController = {
  // Criar pedido a partir do carrinho
  create: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const { addressId, paymentMethodId, instructions } = req.body;

    console.log('paymentMethodId recebido:', paymentMethodId);
    const paymentMethod = await prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
    console.log('paymentMethod encontrado:', paymentMethod);
    if (!paymentMethod) {
      return res.status(400).json({ error: 'Forma de pagamento inválida' });
    }

    // Validar se o endereço foi fornecido
    if (!addressId) {
      return res.status(400).json({ error: 'Endereço de entrega é obrigatório' });
    }

    // Validar se o endereço pertence ao usuário
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== userId) {
      return res.status(400).json({ error: 'Endereço inválido' });
    }

    // Buscar as coordenadas do endereço do cliente
    const addressLat = (address as any).lat;
    const addressLng = (address as any).lng;
    if (typeof addressLat !== 'number' || typeof addressLng !== 'number') {
      return res.status(400).json({ error: 'Endereço do cliente sem coordenadas (lat/lng).' });
    }
    console.log('Coordenadas loja:', STORE_LOCATION);
    console.log('Coordenadas cliente:', addressLat, addressLng);
    const distanceKm = calculateDistance(STORE_LOCATION.lat, STORE_LOCATION.lng, addressLat, addressLng);
    console.log('Distância calculada (km):', distanceKm);
    if (distanceKm > 5) {
      return res.status(400).json({ error: 'Desculpe, seu endereço está fora do alcance de entrega de 5km da loja.' });
    }
    const deliveryFee = Math.round((calculateDeliveryFee(distanceKm) + Number.EPSILON) * 100) / 100;
    console.log('Taxa de entrega calculada:', deliveryFee);

    // Busca o carrinho do usuário
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Carrinho vazio' });
    }

    // Verificar estoque antes de criar o pedido
    for (const item of cart.items) {
      const produto = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!produto) {
        return res.status(400).json({ error: `Produto não encontrado: ${item.productId}` });
      }
      // Verificação especial para produtos fracionados em doses
      if (produto.isFractioned) {
        // Se o produto for fracionado, tentar identificar se é desconto por volume
        // Busca doseItem correspondente, se existir
        let descontoPorVolume = false;
        if (item.doseId) {
          const dose = await prisma.dose.findUnique({ where: { id: item.doseId }, include: { items: true } });
          if (dose) {
            const doseItem = dose.items.find(di => di.productId === item.productId);
            if (doseItem && doseItem.discountBy === 'volume') {
              descontoPorVolume = true;
            }
          }
        }
        if (descontoPorVolume) {
          // Verifica pelo totalVolume
          if ((produto.totalVolume || 0) < item.quantity) {
            return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto '${produto.name}'.` });
          }
        } else {
          // Verifica pelo stock (unidade)
          if ((produto.stock || 0) < item.quantity) {
            return res.status(400).json({ error: `Estoque insuficiente para o produto '${produto.name}'.` });
          }
        }
      } else {
        if ((produto.stock || 0) < item.quantity) {
          return res.status(400).json({ error: `Estoque insuficiente para o produto '${produto.name}'.` });
        }
      }
    }

    // Separar combos, doses e produtos avulsos
    const combosMap: Record<string, any[]> = {};
    const dosesMap: Record<string, any[]> = {};
    const avulsos: any[] = [];
    for (const item of cart.items) {
      const comboInstanceId = (item as any).comboInstanceId;
      const doseInstanceId = (item as any).doseInstanceId;
      if (comboInstanceId) {
        if (!combosMap[comboInstanceId]) combosMap[comboInstanceId] = [];
        combosMap[comboInstanceId].push(item);
      } else if (doseInstanceId) {
        if (!dosesMap[doseInstanceId]) dosesMap[doseInstanceId] = [];
        dosesMap[doseInstanceId].push(item);
      } else {
        avulsos.push(item);
      }
    }

    // Buscar o valor de cada combo cadastrado
    let totalCombos = 0;
    for (const comboItems of Object.values(combosMap)) {
      const comboId = comboItems[0].comboId;
      const combo = await prisma.combo.findUnique({ where: { id: comboId } });
      if (combo) {
        totalCombos += combo.price;
      }
    }

    // Buscar o valor de cada dose cadastrada
    let totalDoses = 0;
    for (const doseItems of Object.values(dosesMap)) {
      const doseId = doseItems[0].doseId;
      const dose = await prisma.dose.findUnique({ where: { id: doseId } });
      if (dose) {
        totalDoses += dose.price;
      }
    }

    // Somar produtos avulsos normalmente
    const totalAvulsos = avulsos.reduce((sum, item) => {
      const valor = (item.price ?? item.product.price) * item.quantity;
      console.log(`[AVULSO] Item ${item.id} (${item.product?.name}): (price: ${item.price ?? item.product.price}) x (qtd: ${item.quantity}) = ${valor}`);
      return sum + valor;
    }, 0);

    const totalProdutos = totalCombos + totalDoses + totalAvulsos;
    console.log('Subtotal dos combos:', totalCombos);
    console.log('Subtotal das doses:', totalDoses);
    console.log('Subtotal dos avulsos:', totalAvulsos);
    console.log('Subtotal dos produtos:', totalProdutos);
    console.log('Taxa de entrega:', deliveryFee);
    const total = totalProdutos + deliveryFee;
    console.log('Total final do pedido:', total);

    // Cria o pedido
    const isPix = paymentMethod.name && paymentMethod.name.toLowerCase().includes('pix');
    const order = await prisma.order.create({
      data: {
        userId,
        addressId,
        paymentMethodId,
        total,
        instructions,
        deliveryFee: deliveryFee as any,
        pixPaymentStatus: isPix ? 'PENDING' as any : undefined,
        deliveryLat: addressLat,
        deliveryLng: addressLng,
        items: {
          create: await Promise.all(cart.items.map(async (item: any) => {
            const produto = await prisma.product.findUnique({ where: { id: item.productId } });
            
            // Determina a quantidade a ser registrada
            let quantityToRecord = item.quantity;
            
            // Se for produto fracionado e não for dose, registra o volume total da garrafa
            if (produto?.isFractioned && !item.doseId) {
              quantityToRecord = produto.unitVolume || 1000; // Volume total da garrafa
            }
            
            return {
              productId: item.productId,
              quantity: quantityToRecord,
              price: item.price ?? item.product.price,
              costPrice: produto?.costPrice || 0,
              doseId: item.doseId || null,
              choosableSelections: item.choosableSelections || null,
              comboInstanceId: item.comboInstanceId || null,
              doseInstanceId: item.doseInstanceId || null,
            };
          })),
        },
      } as any,
      include: { 
        items: { 
          include: { 
            product: true 
          } 
        }, 
        address: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      },
    });
    console.log('[ORDER][LOG] Pedido criado:', { id: order.id, createdAt: order.createdAt, status: order.status });
    // LOG dos itens do pedido após criação
    console.log('[DEBUG][ORDER CREATE] Itens do pedido criados:', order.items.map(i => ({
      id: i.id,
      productId: (i as any).productId,
      doseId: (i as any).doseId,
      comboInstanceId: (i as any).comboInstanceId,
      doseInstanceId: (i as any).doseInstanceId,
      quantity: (i as any).quantity,
      price: (i as any).price
    })));

    // Registrar saída de estoque em StockMovement
    // (REMOVIDO: agora só registra na entrega)

    // Limpa o carrinho
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    // Emitir evento de novo pedido para admins
    const io = getSocketInstance();
    if (io) {
      io.emit('new-order', { order });
    }

    res.status(201).json(order);
  },

  // Listar pedidos do usuário logado
  list: async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } }, address: true },
      orderBy: { createdAt: 'desc' },
    });
    // Mapear para garantir que cada produto tenha o campo 'image'
    const formatted = orders.map((order: any) => ({
      ...order,
      products: order.items.map((item: any) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: (item.product as any).image || '',
      })),
    }));
    res.json(formatted);
  },

  // Admin: listar todos os pedidos
  adminList: async (req: Request, res: Response) => {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: true } },
        address: true,
        paymentMethod: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  },

  // Admin: atualizar status do pedido
  updateStatus: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    // Mapear status do frontend para o enum do Prisma
    const statusMap: Record<string, OrderStatus> = {
      pending: 'PENDING',
      preparing: 'PREPARING',
      delivering: 'DELIVERING',
      delivered: 'DELIVERED',
      cancelled: 'CANCELLED',
      confirmed: 'CONFIRMED',
    };
    const statusEnum = statusMap[String(status)];
    if (!statusEnum) {
      throw new AppError('Status inválido', 400);
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: statusEnum as OrderStatus },
      include: { 
        items: { 
          include: { 
            product: true,
            dose: {
              include: {
                items: {
                  include: {
                    product: true
                  }
                }
              }
            }
          } 
        }, 
        address: true 
      } as any,
    });
    // Subtrair estoque se status for DELIVERED
    if (statusEnum === 'DELIVERED') {
      console.log('[ORDER][LOG] Pedido marcado como entregue. Itens:', JSON.stringify(order.items, null, 2));
      // LOG dos itens do pedido antes do processamento de estoque
      console.log('[DEBUG][ORDER DELIVERED] Itens do pedido para processamento:', order.items.map(i => ({
        id: i.id,
        productId: (i as any).productId,
        doseId: (i as any).doseId,
        comboInstanceId: (i as any).comboInstanceId,
        doseInstanceId: (i as any).doseInstanceId,
        quantity: (i as any).quantity,
        price: (i as any).price
      })));
      // Agrupar doses por doseInstanceId
      const dosesMap: Record<string, any[]> = {};
      const combosMap: Record<string, any[]> = {};
      const outros: any[] = [];
      for (const item of order.items as any[]) {
        const doseInstanceId = (item as any).doseInstanceId;
        const comboInstanceId = (item as any).comboInstanceId;
        if (doseInstanceId) {
          if (!dosesMap[doseInstanceId]) dosesMap[doseInstanceId] = [];
          dosesMap[doseInstanceId].push(item);
        } else if (comboInstanceId) {
          if (!combosMap[comboInstanceId]) combosMap[comboInstanceId] = [];
          combosMap[comboInstanceId].push(item);
        } else {
          outros.push(item);
        }
      }
      
      // Processar cada combo único
      for (const comboItems of Object.values(combosMap)) {
        const item = comboItems[0];
        console.log('[DEBUG][COMBO] Processando comboInstanceId:', (item as any).comboInstanceId);
        
        // Buscar o combo através do comboInstanceId
        // Como o carrinho pode ter sido limpo, vamos buscar diretamente no combo
        // Vamos tentar encontrar um combo que tenha os produtos deste comboInstanceId
        const comboInstanceId = (item as any).comboInstanceId;
        
        // Buscar todos os combos ativos
        const combos = await prisma.combo.findMany({
          where: { active: true },
          include: { items: true }
        });
        
        console.log('[DEBUG][COMBO] Total de combos ativos encontrados:', combos.length);
        
        // Encontrar o combo que corresponde aos produtos deste comboInstanceId
        let foundCombo = null;
        for (const combo of combos) {
          const comboProductIds = combo.items.map(ci => ci.productId).sort();
          const orderProductIds = comboItems.map(oi => (oi as any).productId).sort();
          
          console.log(`[DEBUG][COMBO] Comparando combo "${combo.name}" (ID: ${combo.id}):`);
          console.log(`  - Produtos do combo: ${JSON.stringify(comboProductIds)}`);
          console.log(`  - Produtos do pedido: ${JSON.stringify(orderProductIds)}`);
          console.log(`  - Correspondem: ${JSON.stringify(comboProductIds) === JSON.stringify(orderProductIds)}`);
          
          if (JSON.stringify(comboProductIds) === JSON.stringify(orderProductIds)) {
            foundCombo = combo;
            console.log(`[DEBUG][COMBO] Combo encontrado: ${combo.name} (ID: ${combo.id})`);
            break;
          }
        }
        
        if (foundCombo) {
          console.log('[ORDER][LOG] Descontando estoque de combo:', foundCombo.id);
          console.log('[DESCONTO ESTOQUE][COMBO] Composição do combo:', JSON.stringify(foundCombo.items, null, 2));
          // Para cada item do combo descontar o estoque conforme a quantidade do combo
          for (const comboItem of foundCombo.items) {
            const produto = await prisma.product.findUnique({ where: { id: comboItem.productId } });
            if (!produto) {
              console.error('Produto do combo não encontrado:', comboItem.productId);
              return res.status(400).json({ error: `Produto do combo não encontrado: ${comboItem.productId}` });
            }
            const quantidadeDescontada = Math.abs(Number(comboItem.quantity));
            console.log(`[DEBUG][COMBO] Produto: ${produto.name}, isFractioned: ${produto.isFractioned}, quantidadeDescontada: ${quantidadeDescontada}`);
            
            if (produto.isFractioned) {
              // Produto fracionado em combo: desconta o volume total da garrafa
              const unitVolume = produto.unitVolume || 1000;
              const volumeAtual = produto.totalVolume || 0;
              const novoVolume = volumeAtual - unitVolume; // Desconta uma garrafa inteira
              const novoEstoque = Math.floor(novoVolume / unitVolume);
              console.log(`[COMBO][FRACIONADO] Produto: ${produto.name} | Volume atual: ${volumeAtual} | Descontar: ${unitVolume} ml (garrafa inteira) | Novo estoque: ${novoEstoque} | Novo volume: ${novoVolume}`);
              if (novoVolume < 0) {
                console.error(`[ERRO][COMBO][FRACIONADO] Estoque insuficiente para o produto: ${produto.name}`);
                return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto: ${produto.name}` });
              }
              const updatedProduct = await prisma.product.update({
                where: { id: comboItem.productId },
                data: {
                  totalVolume: novoVolume,
                  stock: novoEstoque
                },
                select: { stock: true, isFractioned: true, totalVolume: true }
              });
              await updateProductStockStatusWithValues(comboItem.productId, prisma, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
            } else {
              // Produto não fracionado: desconta normalmente
              const estoqueAtual = produto.stock || 0;
              const novoEstoque = estoqueAtual - quantidadeDescontada;
              console.log(`[COMBO][NAO FRACIONADO] Produto: ${produto.name} | Estoque atual: ${estoqueAtual} | Descontar: ${quantidadeDescontada} un | Novo estoque: ${novoEstoque}`);
              if (novoEstoque < 0) {
                console.error(`[ERRO][COMBO][NAO FRACIONADO] Estoque insuficiente para o produto: ${produto.name}`);
                return res.status(400).json({ error: `Estoque insuficiente para o produto: ${produto.name}` });
              }
              const updatedProduct = await prisma.product.update({
                where: { id: comboItem.productId },
                data: { stock: novoEstoque },
                select: { stock: true, isFractioned: true, totalVolume: true }
              });
              await updateProductStockStatusWithValues(comboItem.productId, prisma, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
            }
          }
        } else {
          console.error('Combo não encontrado para comboInstanceId:', comboInstanceId);
          console.log('[DEBUG][COMBO] Tratando itens como produtos avulsos...');
          
          // Se não encontrou o combo, trata como produtos avulsos
          for (const orderItem of comboItems) {
            const produto = await prisma.product.findUnique({ where: { id: (orderItem as any).productId } });
            if (!produto) {
              console.error('Produto não encontrado:', (orderItem as any).productId);
              return res.status(400).json({ error: `Produto não encontrado: ${(orderItem as any).productId}` });
            }
            
            const quantidade = (orderItem as any).quantity;
            console.log(`[DEBUG][AVULSO] Produto: ${produto.name}, isFractioned: ${produto.isFractioned}, quantidade: ${quantidade}`);
            
            if (produto.isFractioned) {
              // Produto fracionado: desconta o volume total da garrafa
              const unitVolume = produto.unitVolume || 1000;
              const volumeAtual = produto.totalVolume || 0;
              const novoVolume = volumeAtual - unitVolume; // Desconta uma garrafa inteira
              const novoEstoque = Math.floor(novoVolume / unitVolume);
              console.log(`[AVULSO][FRACIONADO] Produto: ${produto.name} | Volume atual: ${volumeAtual} | Descontar: ${unitVolume} ml (garrafa inteira) | Novo estoque: ${novoEstoque} | Novo volume: ${novoVolume}`);
              if (novoVolume < 0) {
                console.error(`[ERRO][AVULSO][FRACIONADO] Estoque insuficiente para o produto: ${produto.name}`);
                return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto: ${produto.name}` });
              }
              const updatedProduct = await prisma.product.update({
                where: { id: (orderItem as any).productId },
                data: {
                  totalVolume: novoVolume,
                  stock: novoEstoque
                },
                select: { stock: true, isFractioned: true, totalVolume: true }
              });
              await updateProductStockStatusWithValues((orderItem as any).productId, prisma, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
            } else {
              // Produto não fracionado: desconta normalmente
              const estoqueAtual = produto.stock || 0;
              const novoEstoque = estoqueAtual - quantidade;
              console.log(`[AVULSO][NAO FRACIONADO] Produto: ${produto.name} | Estoque atual: ${estoqueAtual} | Descontar: ${quantidade} un | Novo estoque: ${novoEstoque}`);
              if (novoEstoque < 0) {
                console.error(`[ERRO][AVULSO][NAO FRACIONADO] Estoque insuficiente para o produto: ${produto.name}`);
                return res.status(400).json({ error: `Estoque insuficiente para o produto: ${produto.name}` });
              }
              const updatedProduct = await prisma.product.update({
                where: { id: (orderItem as any).productId },
                data: { stock: novoEstoque },
                select: { stock: true, isFractioned: true, totalVolume: true }
              });
              await updateProductStockStatusWithValues((orderItem as any).productId, prisma, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
            }
          }
        }
      }
      
      // Processar cada dose única
      for (const doseItems of Object.values(dosesMap)) {
        const item = doseItems[0];
        console.log('[DEBUG][DOSE] Processando doseInstanceId:', (item as any).doseInstanceId, 'doseId:', item.doseId);
        if (item.doseId) {
          console.log('[ORDER][LOG] Descontando estoque de dose:', item.doseId);
          // Buscar a composição da dose
          const dose = await prisma.dose.findUnique({
            where: { id: item.doseId },
            include: { items: true }
          });
          if (!dose) {
            console.error('Dose não encontrada:', item.doseId);
            return res.status(400).json({ error: 'Dose não encontrada.' });
          }
          console.log('[DESCONTO ESTOQUE][DOSE] Composição da dose:', JSON.stringify(dose.items, null, 2));
          // Para cada item da dose descontar o estoque conforme a quantidade da dose
          for (const doseItem of dose.items) {
            const produto = await prisma.product.findUnique({ where: { id: doseItem.productId } });
            if (!produto) {
              console.error('Produto da dose não encontrado:', doseItem.productId);
              return res.status(400).json({ error: `Produto da dose não encontrado: ${doseItem.productId}` });
            }
            const quantidadeDescontada = Math.abs(Number(doseItem.quantity));
            console.log(`[DEBUG][DOSE] Produto: ${produto.name}, isFractioned: ${produto.isFractioned}, discountBy: ${doseItem.discountBy}, quantidadeDescontada: ${quantidadeDescontada}`);
            if (produto.isFractioned && doseItem.discountBy === 'volume') {
              // Descontar volume
              const volumeAtual = produto.totalVolume || 0;
              const unitVolume = produto.unitVolume || 1;
              const novoVolume = volumeAtual - quantidadeDescontada;
              const novoEstoque = Math.floor(novoVolume / unitVolume);
              console.log(`[DOSE][FRACIONADO][VOLUME][INSTANCIA] Produto: ${produto.name} | Volume atual: ${volumeAtual} | Descontar: ${quantidadeDescontada} ml | Novo estoque: ${novoEstoque} | Novo volume: ${novoVolume}`);
              if (novoVolume < 0) {
                console.error(`[ERRO][DOSE][FRACIONADO][VOLUME] Estoque insuficiente para o produto: ${produto.name}`);
                return res.status(400).json({ error: `Estoque insuficiente (volume) para o produto: ${produto.name}` });
              }
              const updatedProduct = await prisma.product.update({
                where: { id: doseItem.productId },
                data: {
                  totalVolume: novoVolume,
                  stock: novoEstoque
                },
                select: { stock: true, isFractioned: true, totalVolume: true }
              });
              await updateProductStockStatusWithValues(doseItem.productId, prisma, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
            } else {
              // Descontar unidade
              const estoqueAtual = produto.stock || 0;
              const novoEstoque = estoqueAtual - quantidadeDescontada;
              console.log(`[DOSE][NAO FRACIONADO][INSTANCIA] Produto: ${produto.name} | Estoque atual: ${estoqueAtual} | Descontar: ${quantidadeDescontada} un | Novo estoque: ${novoEstoque}`);
              if (novoEstoque < 0) {
                console.error(`[ERRO][DOSE][NAO FRACIONADO] Estoque insuficiente para o produto: ${produto.name}`);
                return res.status(400).json({ error: `Estoque insuficiente para o produto: ${produto.name}` });
              }
              const updatedProduct = await prisma.product.update({
                where: { id: doseItem.productId },
                data: { stock: novoEstoque },
                select: { stock: true, isFractioned: true, totalVolume: true }
              });
              await updateProductStockStatusWithValues(doseItem.productId, prisma, updatedProduct.stock, updatedProduct.isFractioned, updatedProduct.totalVolume);
            }
          }
        }
      }
      // Processar os outros itens normalmente (produtos avulsos, combos, etc)
      for (const item of outros) {
        // ... manter lógica existente para outros itens ...
      }

      // Registrar saída de estoque em StockMovement para entrega
      console.log('[ORDER][DELIVERED] Registrando saída de estoque em StockMovement...');
      
      // Registrar saídas de combos
      for (const comboItems of Object.values(combosMap)) {
        const item = comboItems[0];
        const comboInstanceId = (item as any).comboInstanceId;
        
        // Buscar todos os combos ativos
        const combos = await prisma.combo.findMany({
          where: { active: true },
          include: { items: true }
        });
        
        // Encontrar o combo que corresponde aos produtos deste comboInstanceId
        let foundCombo = null;
        for (const combo of combos) {
          const comboProductIds = combo.items.map(ci => ci.productId).sort();
          const orderProductIds = comboItems.map(oi => (oi as any).productId).sort();
          
          if (JSON.stringify(comboProductIds) === JSON.stringify(orderProductIds)) {
            foundCombo = combo;
            break;
          }
        }
        
        if (foundCombo) {
          // Registrar saída para cada item do combo
          for (const comboItem of foundCombo.items) {
            const produto = await prisma.product.findUnique({ where: { id: comboItem.productId } });
            if (!produto) continue;
            
            const quantidadeDescontada = Math.abs(Number(comboItem.quantity));
            const totalCost = (produto.costPrice || 0) * quantidadeDescontada;
            
            await prisma.stockMovement.create({
              data: {
                productId: comboItem.productId,
                type: 'out',
                quantity: quantidadeDescontada,
                unitCost: produto.costPrice || 0,
                totalCost,
                notes: 'Entrega - Combo',
                origin: 'entrega_online'
              }
            });
          }
        } else {
          // Se não encontrou o combo, registrar como produtos avulsos
          for (const orderItem of comboItems) {
            const produto = await prisma.product.findUnique({ where: { id: (orderItem as any).productId } });
            if (!produto) continue;
            
            const quantidade = (orderItem as any).quantity;
            const totalCost = (produto.costPrice || 0) * quantidade;
            
            await prisma.stockMovement.create({
              data: {
                productId: (orderItem as any).productId,
                type: 'out',
                quantity: quantidade,
                unitCost: produto.costPrice || 0,
                totalCost,
                notes: 'Entrega - Produto Avulso',
                origin: 'entrega_online'
              }
            });
          }
        }
      }
      
      // Registrar saídas de doses
      for (const doseItems of Object.values(dosesMap)) {
        const item = doseItems[0];
        if (item.doseId) {
          const dose = await prisma.dose.findUnique({
            where: { id: item.doseId },
            include: { items: true }
          });
          
          if (dose) {
            for (const doseItem of dose.items) {
              const produto = await prisma.product.findUnique({ where: { id: doseItem.productId } });
              if (!produto) continue;
              
              const quantidadeDescontada = Math.abs(Number(doseItem.quantity));
              const totalCost = (produto.costPrice || 0) * quantidadeDescontada;
              
              await prisma.stockMovement.create({
                data: {
                  productId: doseItem.productId,
                  type: 'out',
                  quantity: quantidadeDescontada,
                  unitCost: produto.costPrice || 0,
                  totalCost,
                  notes: 'Entrega - Dose',
                  origin: 'entrega_online'
                }
              });
            }
          }
        }
      }
      
      // Registrar saídas de produtos avulsos
      for (const item of outros) {
        const produto = await prisma.product.findUnique({ where: { id: (item as any).productId } });
        if (!produto) continue;
        
        const quantidade = (item as any).quantity;
        const totalCost = (produto.costPrice || 0) * quantidade;
        
        await prisma.stockMovement.create({
          data: {
            productId: (item as any).productId,
            type: 'out',
            quantity: quantidade,
            unitCost: produto.costPrice || 0,
            totalCost,
            notes: 'Entrega - Produto Avulso',
            origin: 'entrega_online'
          }
        });
      }
    }
    // Criar notificação para o usuário
    const statusMessages: Record<string, string> = {
      PENDING: 'Seu pedido foi recebido e está aguardando confirmação.',
      CONFIRMED: 'Seu pedido foi confirmado!',
      PREPARING: 'Seu pedido está sendo preparado.',
      DELIVERING: 'Seu pedido saiu para entrega!',
      DELIVERED: 'Seu pedido foi entregue!',
      CANCELLED: 'Seu pedido foi cancelado.'
    };
    const message = statusMessages[statusEnum] || `Status do pedido atualizado: ${statusEnum}`;
    const notification = await prisma.notification.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        message,
      }
    });
    // Emitir evento para o cliente
    const io = getSocketInstance();
    if (io) {
      io.to(order.userId).emit('order-notification', { notification });
      io.to(order.userId).emit('order-updated', { order });
    }
    res.json(order);
  },

  // Admin: atualizar localização do entregador
  updateLocation: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { deliveryLat, deliveryLng } = req.body;
    const order = await prisma.order.update({
      where: { id },
      data: { deliveryLat, deliveryLng },
      include: { items: { include: { product: true } }, address: true },
    });
    // Emitir evento para o cliente
    const io = getSocketInstance();
    if (io) {
      io.to(order.userId).emit('order-updated', { order });
    }
    res.json(order);
  },

  // Motoboy: listar todos os pedidos em entrega
  motoboyList: async (req: Request, res: Response) => {
    const orders = await prisma.order.findMany({
      where: { status: 'DELIVERING' },
      include: {
        items: { include: { product: true } },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    // Formatar para o frontend do motoboy
    const formatted = orders.map((order: any) => ({
      id: order.id,
      status: order.status,
      address: `${order.address.title} - ${order.address.street}, ${order.address.number}${order.address.complement ? ' ' + order.address.complement : ''}, ${order.address.neighborhood}, ${order.address.city} - ${order.address.state}, CEP: ${order.address.zipcode}`,
      products: order.items.map((item: any) => ({
        name: item.product?.name ?? '',
        quantity: item.quantity
      })),
      createdAt: order.createdAt,
      total: order.total
    }));
    res.json(formatted);
  },

  // Motoboy/Admin: atualizar status do pedido para DELIVERED
  motoboyUpdateStatus: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    // Permitir apenas DELIVERED
    if (status !== 'delivered' && status !== 'DELIVERED') {
      return res.status(403).json({ error: 'Motoboy só pode marcar como entregue.' });
    }
    const order = await prisma.order.update({
      where: { id },
      data: { status: 'DELIVERED' },
      include: { items: { include: { product: true } }, address: true },
    });
    // Emitir evento para o cliente
    const io = getSocketInstance();
    if (io) {
      io.to(order.userId).emit('order-updated', { order });
    }
    res.json(order);
  },

  calculateDeliveryFee: async (req: Request, res: Response) => {
    const { addressId } = req.body;
    if (!addressId) {
      return res.status(400).json({ error: 'Endereço de entrega é obrigatório' });
    }
    // @ts-ignore
    const userId = req.user.id;
    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== userId) {
      return res.status(400).json({ error: 'Endereço inválido' });
    }
    const addressLat = (address as any).lat;
    const addressLng = (address as any).lng;
    if (typeof addressLat !== 'number' || typeof addressLng !== 'number') {
      return res.status(400).json({ error: 'Endereço do cliente sem coordenadas (lat/lng).' });
    }
    console.log('Coordenadas loja:', STORE_LOCATION);
    console.log('Coordenadas cliente:', addressLat, addressLng);
    const distanceKm = calculateDistance(STORE_LOCATION.lat, STORE_LOCATION.lng, addressLat, addressLng);
    console.log('Distância calculada (km):', distanceKm);
    const deliveryFee = Math.round((calculateDeliveryFee(distanceKm) + Number.EPSILON) * 100) / 100;
    console.log('Taxa de entrega calculada:', deliveryFee);
    res.json({ deliveryFee });
  },

  // Admin: atualizar status do pagamento PIX
  updatePixStatus: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { pixPaymentStatus } = req.body;
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(pixPaymentStatus)) {
      return res.status(400).json({ error: 'Status PIX inválido.' });
    }
    const order = await prisma.order.update({
      where: { id },
      data: { pixPaymentStatus: pixPaymentStatus as any },
      include: { items: { include: { product: true } }, address: true },
    });
    // Emitir evento para o cliente
    const io = getSocketInstance();
    if (io) {
      io.to(order.userId).emit('order-updated', { order });
    }
    res.json(order);
  },
}; 