import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../config/errorHandler';
import { getSocketInstance } from '../config/socketInstance';
import { payment } from '../config/mercadopago';

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

    // Buscar dados do usuário para o PIX
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, cpf: true } });
    if (!user || !user.cpf) {
      return res.status(400).json({ error: 'Usuário sem CPF cadastrado.' });
    }
    // Verifica se o método de pagamento é PIX
    if (paymentMethod.name.toLowerCase().includes('pix')) {
      try {
        console.log('Iniciando criação de cobrança PIX via Mercado Pago...');
        const mpRes = await payment.create({
          body: {
            transaction_amount: total,
            description: 'Pedido na Adega',
            payment_method_id: 'pix',
            payer: {
              email: user.email,
              first_name: user.name ? user.name.split(' ')[0] : 'Cliente',
              last_name: user.name ? user.name.split(' ').slice(1).join(' ') || 'App' : 'App',
              identification: {
                type: 'CPF',
                number: user.cpf
              }
            },
          },
        });
        console.log('Resposta Mercado Pago:', JSON.stringify(mpRes, null, 2));
        if (!mpRes.point_of_interaction || !mpRes.point_of_interaction.transaction_data) {
          return res.status(500).json({ error: 'Erro ao gerar cobrança PIX. Tente novamente.' });
        }
        const pixData = mpRes.point_of_interaction.transaction_data;
        if (!mpRes.id || !pixData.qr_code || !pixData.qr_code_base64) {
          return res.status(500).json({ error: 'Erro ao gerar QR Code PIX. Tente novamente.' });
        }
        // Cria o pedido com status aguardando pagamento PIX
        const order = await prisma.order.create({
          data: {
            userId,
            addressId,
            paymentMethodId,
            total,
            instructions,
            deliveryFee: deliveryFee as any,
            pixStatus: 'AGUARDANDO',
            pixPaymentId: mpRes.id.toString(),
            pixQrCode: pixData.qr_code,
            pixQrCodeImage: pixData.qr_code_base64,
            items: {
              create: cart.items.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price ?? item.product.price,
              })),
            },
          } as any,
          include: {
            items: { include: { product: true } },
            address: true,
            user: { select: { name: true, email: true } },
          },
        });
        // Limpa o carrinho
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        // Retorna o QR Code PIX e dados do pedido
        return res.status(201).json({ ...order, pixQrCode: pixData.qr_code, pixQrCodeImage: pixData.qr_code_base64 });
      } catch (err: any) {
        console.error('Erro ao criar cobrança PIX no Mercado Pago:', err?.response?.data || err);
        return res.status(500).json({
          error: 'Erro ao criar cobrança PIX no Mercado Pago.',
          details: err?.response?.data || err?.message || err
        });
      }
    }

    // Cria o pedido
    const order = await prisma.order.create({
      data: {
        userId,
        addressId,
        paymentMethodId,
        total,
        instructions,
        deliveryFee: deliveryFee as any,
        items: {
          create: cart.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price ?? item.product.price,
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
            email: true
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
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
        address: true,
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
      include: { items: { include: { product: true } }, address: true },
    });
    // Subtrair estoque se status for DELIVERED
    if (statusEnum === 'DELIVERED') {
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.productId) {
            // Produto normal
            await prisma.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } }
            });
          }
        }
      }
    }
    // Emitir evento para o cliente
    const io = getSocketInstance();
    if (io) {
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
}; 