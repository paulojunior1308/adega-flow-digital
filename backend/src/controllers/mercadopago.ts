import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const mercadopagoController = {
  webhook: async (req: Request, res: Response) => {
    try {
      const { id, topic, type, data } = req.body;
      // Para pagamentos PIX, o Mercado Pago envia topic/type = 'payment'
      let paymentId = id;
      if (!paymentId && data && data.id) paymentId = data.id;
      if (!paymentId) return res.status(400).json({ error: 'ID de pagamento não encontrado' });

      // Buscar status do pagamento no Mercado Pago (opcional, mas recomendado)
      // const mpRes = await mercadopago.payment.findById(paymentId);
      // const status = mpRes.body.status;
      // if (status !== 'approved') return res.sendStatus(200);

      // Atualizar pedido no banco
      const order = await prisma.order.findFirst({ where: { pixPaymentId: paymentId.toString() } as any });
      if (!order) return res.status(404).json({ error: 'Pedido não encontrado para este pagamento' });
      await prisma.order.update({
        where: { id: order.id },
        data: { pixStatus: 'APROVADO' } as any,
      });
      return res.sendStatus(200);
    } catch (err) {
      console.error('Erro no webhook Mercado Pago:', err);
      return res.sendStatus(500);
    }
  },
}; 