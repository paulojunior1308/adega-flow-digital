import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../config/errorHandler';
import { getSocketInstance } from '../config/socketInstance';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';

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
      if ((produto.stock || 0) < item.quantity) {
        return res.status(400).json({ error: `Estoque insuficiente para o produto '${produto.name}'.` });
      }
    }

    // Calcula total usando o preço ajustado do cartItem
    const totalProdutos = cart.items.reduce((sum: number, item: any) => sum + (item.price ?? item.product.price) * item.quantity, 0);
    const total = totalProdutos + deliveryFee;

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
          create: cart.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price ?? item.product.price,
            doseId: item.doseId || null,
            choosableSelections: item.choosableSelections || null,
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
      },
    });
    // Subtrair estoque se status for DELIVERED
    if (statusEnum === 'DELIVERED') {
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.doseId) {
            console.log('[DESCONTO ESTOQUE][DOSE] Payload recebido:', JSON.stringify(item, null, 2));
            // Buscar a composição da dose
            const dose = await prisma.dose.findUnique({
              where: { id: item.doseId },
              include: { items: true }
            });
            if (!dose) {
              console.error('Dose não encontrada:', item.doseId);
              throw new AppError('Dose não encontrada.', 404);
            }
            console.log('[DESCONTO ESTOQUE][DOSE] Composição da dose:', JSON.stringify(dose.items, null, 2));
            // Se houver seleções de escolhíveis, elas vêm em item.choosableSelections
            const choosableSelections = item.choosableSelections || {};
            for (const doseItem of dose.items) {
              if (doseItem.allowFlavorSelection && doseItem.categoryId) {
                const selections = choosableSelections[doseItem.categoryId] || {};
                for (const [productId, qty] of Object.entries(selections)) {
                  const quantidadeFinal = Number(qty) * item.quantity;
                  const produto = await prisma.product.findUnique({ where: { id: productId } });
                  console.log('[DESCONTO ESTOQUE][DOSE] Produto escolhido:', produto);
                  if (!produto) {
                    console.error('Produto escolhido não encontrado:', productId);
                    throw new AppError(`Produto escolhido não encontrado: ${productId}`, 404);
                  }
                  if (produto.isFractioned) {
                    const novoVolume = (produto.totalVolume || 0) - (doseItem.quantity * quantidadeFinal);
                    console.log(`[DESCONTO ESTOQUE][DOSE] Descontando volume do produto escolhido (${produto.name}): antes=${produto.totalVolume}, descontado=${doseItem.quantity * quantidadeFinal}, depois=${novoVolume}`);
                    if (novoVolume < 0) {
                      console.error('Estoque insuficiente (volume) para o produto:', produto.name);
                      throw new AppError(`Estoque insuficiente (volume) para o produto: ${produto.name}`, 400);
                    }
                    await prisma.product.update({
                      where: { id: productId },
                      data: { totalVolume: novoVolume }
                    });
                  } else {
                    const novoEstoque = (produto.stock || 0) - quantidadeFinal;
                    console.log(`[DESCONTO ESTOQUE][DOSE] Descontando unidade do produto escolhido (${produto.name}): antes=${produto.stock}, descontado=${quantidadeFinal}, depois=${novoEstoque}`);
                    if (novoEstoque < 0) {
                      console.error('Estoque insuficiente para o produto:', produto.name);
                      throw new AppError(`Estoque insuficiente para o produto: ${produto.name}`, 400);
                    }
                    await prisma.product.update({
                      where: { id: productId },
                      data: { stock: novoEstoque }
                    });
                  }
                }
              }
              const produto = await prisma.product.findUnique({ where: { id: doseItem.productId } });
              console.log('[DESCONTO ESTOQUE][DOSE] Produto da dose:', produto);
              if (!produto) {
                console.error('Produto da dose não encontrado:', doseItem.productId);
                throw new AppError(`Produto da dose não encontrado: ${doseItem.productId}`, 404);
              }
              if (doseItem.discountBy === 'volume') {
                const novoVolume = (produto.totalVolume || 0) - (doseItem.quantity * item.quantity);
                console.log(`[DESCONTO ESTOQUE][DOSE] Descontando volume do produto da dose (${produto.name}): antes=${produto.totalVolume}, descontado=${doseItem.quantity * item.quantity}, depois=${novoVolume}`);
                if (novoVolume < 0) {
                  console.error('Estoque insuficiente (volume) para o produto:', produto.name);
                  throw new AppError(`Estoque insuficiente (volume) para o produto: ${produto.name}`, 400);
                }
                await prisma.product.update({
                  where: { id: doseItem.productId },
                  data: { totalVolume: novoVolume }
                });
              } else {
                const novoEstoque = (produto.stock || 0) - (doseItem.quantity * item.quantity);
                console.log(`[DESCONTO ESTOQUE][DOSE] Descontando unidade do produto da dose (${produto.name}): antes=${produto.stock}, descontado=${doseItem.quantity * item.quantity}, depois=${novoEstoque}`);
                if (novoEstoque < 0) {
                  console.error('Estoque insuficiente para o produto:', produto.name);
                  throw new AppError(`Estoque insuficiente para o produto: ${produto.name}`, 400);
                }
                await prisma.product.update({
                  where: { id: doseItem.productId },
                  data: { stock: novoEstoque }
                });
              }
            }
          } else if (item.productId) {
            // Produto normal
            await prisma.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } }
            });
          }
        }
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