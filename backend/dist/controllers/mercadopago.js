"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mercadopagoController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
exports.mercadopagoController = {
    webhook: async (req, res) => {
        try {
            const { id, topic, type, data } = req.body;
            let paymentId = id;
            if (!paymentId && data && data.id)
                paymentId = data.id;
            if (!paymentId)
                return res.status(400).json({ error: 'ID de pagamento não encontrado' });
            const order = await prisma_1.default.order.findFirst({ where: { pixPaymentId: paymentId.toString() } });
            if (!order)
                return res.status(404).json({ error: 'Pedido não encontrado para este pagamento' });
            await prisma_1.default.order.update({
                where: { id: order.id },
                data: { pixStatus: 'APROVADO' },
            });
            return res.sendStatus(200);
        }
        catch (err) {
            console.error('Erro no webhook Mercado Pago:', err);
            return res.sendStatus(500);
        }
    },
};
