  createPDVSale: async (req: Request, res: Response) => {
    const { items, paymentMethodId } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Nenhum item informado.' });
    }
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Meio de pagamento obrigatório.' });
    }

    const paymentMethod = await prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
    if (!paymentMethod) {
      return res.status(400).json({ error: 'Meio de pagamento inválido.' });
    }

    const userId = req.user.id;
    const validItems = items.filter(item => !!item.productId || !!item.doseId);
    
    // Buscar produtos e doses
    const products = await prisma.product.findMany({
      where: { id: { in: validItems.filter(i => i.productId).map(i => i.productId) } },
      select: { 
        id: true,
        stock: true,
        isFractioned: true,
        totalVolume: true,
        unitVolume: true
      }
    });

    const doses = await prisma.dose.findMany({
      where: { id: { in: validItems.filter(i => i.doseId).map(i => i.doseId) } },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                stock: true,
                isFractioned: true,
                totalVolume: true,
                unitVolume: true
              }
            }
          }
        }
      }
    });

    // Verificar estoque
    for (const item of validItems) {
      if (item.productId) {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          return res.status(400).json({ error: `Produto ${item.productId} não encontrado.` });
        }

        if (product.isFractioned) {
          const volumeNeeded = item.quantity * (product.unitVolume || 0);
          const availableVolume = product.stock * (product.totalVolume || 0);
          if (volumeNeeded > availableVolume) {
            return res.status(400).json({ error: `Estoque insuficiente para o produto ${item.productId}.` });
          }
        } else {
          if (item.quantity > product.stock) {
            return res.status(400).json({ error: `Estoque insuficiente para o produto ${item.productId}.` });
          }
        }
      } else if (item.doseId) {
        const dose = doses.find(d => d.id === item.doseId);
        if (!dose) {
          return res.status(400).json({ error: `Dose ${item.doseId} não encontrada.` });
        }

        for (const doseItem of dose.items) {
          const product = doseItem.product;
          const quantityNeeded = doseItem.quantity * item.quantity;

          if (product.isFractioned) {
            const volumeNeeded = quantityNeeded * (product.unitVolume || 0);
            const availableVolume = product.stock * (product.totalVolume || 0);
            if (volumeNeeded > availableVolume) {
              return res.status(400).json({ error: `Estoque insuficiente para o produto ${product.id} na dose ${dose.name}.` });
            }
          } else {
            if (quantityNeeded > product.stock) {
              return res.status(400).json({ error: `Estoque insuficiente para o produto ${product.id} na dose ${dose.name}.` });
            }
          }
        }
      }
    }

    // Criar a venda
    const sale = await prisma.sale.create({
      data: {
        userId,
        paymentMethodId,
        total: 0, // Será atualizado após calcular o total
        items: {
          create: validItems.map(item => ({
            productId: item.productId,
            doseId: item.doseId,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0
          }))
        }
      },
      include: {
        items: true
      }
    });

    // Atualizar estoque
    for (const item of validItems) {
      if (item.productId) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          if (product.isFractioned) {
            const volumeToDeduct = item.quantity * (product.unitVolume || 0);
            const unitsToDeduct = Math.ceil(volumeToDeduct / (product.totalVolume || 1));
            await prisma.product.update({
              where: { id: product.id },
              data: { stock: { decrement: unitsToDeduct } }
            });
          } else {
            await prisma.product.update({
              where: { id: product.id },
              data: { stock: { decrement: item.quantity } }
            });
          }
        }
      } else if (item.doseId) {
        const dose = doses.find(d => d.id === item.doseId);
        if (dose) {
          for (const doseItem of dose.items) {
            const product = doseItem.product;
            const quantityToDeduct = doseItem.quantity * item.quantity;

            if (product.isFractioned) {
              const volumeToDeduct = quantityToDeduct * (product.unitVolume || 0);
              const unitsToDeduct = Math.ceil(volumeToDeduct / (product.totalVolume || 1));
              await prisma.product.update({
                where: { id: product.id },
                data: { stock: { decrement: unitsToDeduct } }
              });
            } else {
              await prisma.product.update({
                where: { id: product.id },
                data: { stock: { decrement: quantityToDeduct } }
              });
            }
          }
        }
      }
    }

    // Calcular e atualizar o total da venda
    const total = sale.items.reduce((acc, item) => {
      return acc + (item.price * item.quantity) - (item.discount || 0);
    }, 0);

    await prisma.sale.update({
      where: { id: sale.id },
      data: { total }
    });

    res.json({ ...sale, total });
  }, 