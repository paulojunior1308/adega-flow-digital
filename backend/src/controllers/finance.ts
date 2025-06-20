import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { OrderStatus, PixPaymentStatus, SaleStatus, Prisma } from '@prisma/client';

interface DoseItemWithProduct {
  quantity: number;
  product: {
    costPrice: number;
    totalVolume?: number | null;
  };
}

interface DoseWithItems {
  items: DoseItemWithProduct[];
}

export const financeController = {
  report: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      // Ajustar filtro de datas para ignorar horário
      let start = startDate ? new Date(startDate as string) : undefined;
      let end = endDate ? new Date(endDate as string) : undefined;
      if (end) {
        // Adiciona 1 dia para pegar até o final do dia
        end.setDate(end.getDate() + 1);
      }
      const dateFilter2: any = {};
      if (start) dateFilter2.gte = start;
      if (end) dateFilter2.lt = end;

      // Buscar vendas do Sale (PDV/Admin) - status COMPLETED
      const salesData = await prisma.sale.findMany({
        where: {
          status: 'COMPLETED',
          ...(Object.keys(dateFilter2).length > 0 ? { createdAt: dateFilter2 } : {})
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      }) as any[];

      // Buscar vendas do Order (Delivery/App) - status DELIVERED
      const ordersData = await prisma.order.findMany({
        where: {
          status: 'DELIVERED',
          ...(Object.keys(dateFilter2).length > 0 ? { createdAt: dateFilter2 } : {})
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      }) as any[];

      // Calcular total de vendas e custo
      let total_sales = 0;
      let total_cost = 0;

      const processItems = (items: any[], sourceId: string, sourceType: 'Sale' | 'Order') => {
        items.forEach((item: any) => {
          // Usa o preço de venda que foi salvo no item. Para combos, o preço total pode estar em um único item.
          const itemTotal = Number(item.price); 
          let itemCost = 0;
          
          const quantity = Number(item.quantity) || 0;
          // Usa o costPrice que foi salvo no item no momento da venda.
          // Este é o custo por unidade (seja garrafa ou unidade normal).
          const costAtTimeOfSale = Number(item.costPrice) || 0;

          // Detecta se é uma venda de dose baseada na quantidade vs volume da garrafa
          const bottleVolume = item.product?.unitVolume || 1000; // Volume da garrafa em ml
          
          // Detecta se é uma venda de dose (quantidade significativamente menor que o volume da garrafa)
          // Considera dose se a quantidade for menos de 80% do volume da garrafa
          const isDoseSale = item.product?.isFractioned && quantity < (bottleVolume * 0.8);
          
          // Detecta se é uma venda de garrafa inteira (preço alto comparado ao custo unitário)
          const isFullBottleSale = item.product?.isFractioned && 
            itemTotal > (costAtTimeOfSale * 0.5) && // Se o preço for mais de 50% do custo unitário
            quantity < bottleVolume; // E a quantidade for menor que o volume da garrafa
          
          // Se for produto fracionado e não for dose nem garrafa inteira, é combo/avulso
          const isComboOrAvulso = item.product?.isFractioned && !isDoseSale && !isFullBottleSale;
          
          if (isDoseSale) {
            // Venda de dose: calcula custo proporcional ao volume
            const costPerMl = costAtTimeOfSale / bottleVolume;
            itemCost = costPerMl * quantity;
            
            console.log(`- Item: ${item.product.name} (Venda de Dose)`);
            console.log(`  Fonte: ${sourceType} ID: ${sourceId}`);
            console.log(`  Preço Registrado: R$ ${itemTotal.toFixed(2)}`);
            console.log(`  Volume Vendido: ${quantity}ml`);
            console.log(`  Custo da Garrafa: R$ ${costAtTimeOfSale.toFixed(2)}`);
            console.log(`  Volume da Garrafa: ${bottleVolume}ml`);
            console.log(`  Custo por ml: R$ ${costPerMl.toFixed(4)}`);
            console.log(`  Custo Total do Item: R$ ${itemCost.toFixed(2)}`);
          } else if (isFullBottleSale) {
            // Venda de garrafa inteira: usa o custo da garrafa completa
            itemCost = costAtTimeOfSale;
            
            console.log(`- Item: ${item.product.name} (Venda de Garrafa Inteira)`);
            console.log(`  Fonte: ${sourceType} ID: ${sourceId}`);
            console.log(`  Preço Registrado: R$ ${itemTotal.toFixed(2)}`);
            console.log(`  Quantidade Registrada: ${quantity}ml`);
            console.log(`  Volume da Garrafa: ${bottleVolume}ml`);
            console.log(`  Custo da Garrafa Inteira: R$ ${costAtTimeOfSale.toFixed(2)}`);
            console.log(`  Custo Total do Item: R$ ${itemCost.toFixed(2)}`);
          } else {
            // Venda normal ou combo: usa o custo unitário completo
            // Para produtos fracionados em combo/avulso, considera o volume total da garrafa
            if (item.product?.isFractioned) {
              // Produto fracionado em combo/avulso: usa o custo da garrafa inteira
              itemCost = costAtTimeOfSale;
              console.log(`- Item: ${item.product.name} (Venda Normal/Combo - Garrafa Inteira)`);
              console.log(`  Fonte: ${sourceType} ID: ${sourceId}`);
              console.log(`  Preço Registrado: R$ ${itemTotal.toFixed(2)}`);
              console.log(`  Quantidade Registrada: ${quantity}ml`);
              console.log(`  Volume da Garrafa: ${bottleVolume}ml`);
              console.log(`  Custo da Garrafa Inteira: R$ ${costAtTimeOfSale.toFixed(2)}`);
              console.log(`  Custo Total do Item: R$ ${itemCost.toFixed(2)}`);
            } else {
              // Produto não fracionado: usa o custo unitário × quantidade
              itemCost = costAtTimeOfSale * quantity;
              console.log(`- Item: ${item.product.name} (Venda Normal/Combo)`);
              console.log(`  Fonte: ${sourceType} ID: ${sourceId}`);
              console.log(`  Preço Registrado: R$ ${itemTotal.toFixed(2)}`);
              console.log(`  Quantidade: ${quantity}`);
              console.log(`  Custo Unitário Salvo: R$ ${costAtTimeOfSale.toFixed(2)}`);
              console.log(`  Custo Total do Item: R$ ${itemCost.toFixed(2)}`);
            }
          }
          
          total_sales += itemTotal;
          total_cost += itemCost;
        });
      };

      console.log('\n=== Detalhamento das Vendas (Sale) ===');
      // Processar vendas do Sale
      salesData.forEach(sale => {
        console.log(`\nVenda ID: ${sale.id}`);
        processItems(sale.items, sale.id, 'Sale');
      });

      console.log('\n=== Detalhamento dos Pedidos (Order) ===');
      // Processar vendas do Order
      ordersData.forEach(order => {
        console.log(`\nPedido ID: ${order.id}`);
        processItems(order.items, order.id, 'Order');
      });

      console.log('\n=== Resumo Financeiro ===');
      console.log(`Total de Vendas: R$ ${total_sales.toFixed(2)}`);
      console.log(`Total de Custos: R$ ${total_cost.toFixed(2)}`);

      const gross_profit = total_sales - total_cost;

      // Buscar despesas (accounts_payable)
      const expenses = await prisma.accountPayable.findMany({
        where: Object.keys(dateFilter2).length > 0 ? { createdAt: dateFilter2 } : {},
      });
      const total_expenses = expenses.reduce((sum, e) => sum + (Number(e.value) || 0), 0);

      const net_profit = gross_profit - total_expenses;

      console.log('Filtro de datas recebido:', { startDate, endDate, dateFilter2 });
      console.log('Vendas (Sale) encontradas:', salesData.length);
      console.log('Pedidos (Order) encontrados:', ordersData.length);

      res.json({
        total_sales: Number(total_sales.toFixed(2)),
        total_cost: Number(total_cost.toFixed(2)),
        gross_profit: Number(gross_profit.toFixed(2)),
        total_expenses: Number(total_expenses.toFixed(2)),
        net_profit: Number(net_profit.toFixed(2))
      });
    } catch (error) {
      console.error('Erro ao gerar relatório financeiro:', error);
      res.status(500).json({ error: 'Erro ao gerar relatório financeiro' });
    }
  }
}; 