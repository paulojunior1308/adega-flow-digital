import { StockStatus } from '@prisma/client';

/**
 * Calcula o status do estoque baseado no estoque atual e se é fracionado
 * @param stock - Quantidade em estoque
 * @param isFractioned - Se o produto é fracionado
 * @param totalVolume - Volume total em ml (para produtos fracionados)
 * @returns StockStatus
 */
export function calculateStockStatus(
  stock: number, 
  isFractioned: boolean = false, 
  totalVolume: number | null = null
): StockStatus {
  // Para produtos fracionados, verificar se o volume está zerado
  if (isFractioned && (totalVolume === null || totalVolume <= 0)) {
    return StockStatus.OUT_OF_STOCK;
  }
  
  // Para produtos não fracionados ou fracionados com volume > 0
  if (stock <= 0) {
    return StockStatus.OUT_OF_STOCK;
  }
  
  if (stock <= 5) {
    return StockStatus.LOW_STOCK;
  }
  
  return StockStatus.IN_STOCK;
}

/**
 * Atualiza o status do estoque de um produto no banco de dados, recebendo valores já atualizados
 * @param productId - ID do produto
 * @param prisma - Instância do Prisma
 * @param stock - Estoque atualizado
 * @param isFractioned - Se é fracionado
 * @param totalVolume - Volume atualizado
 */
export async function updateProductStockStatusWithValues(
  productId: string,
  prisma: any,
  stock: number,
  isFractioned: boolean,
  totalVolume: number | null
): Promise<void> {
  const newStatus = calculateStockStatus(stock, isFractioned, totalVolume);
  await prisma.product.update({
    where: { id: productId },
    data: { stockStatus: newStatus }
  });
}

/**
 * Mapeia o StockStatus para texto em português
 * @param status - Status do estoque
 * @returns Texto em português
 */
export function getStockStatusText(status: StockStatus): string {
  switch (status) {
    case StockStatus.OUT_OF_STOCK:
      return 'ESGOTADO';
    case StockStatus.LOW_STOCK:
      return 'ESTOQUE BAIXO';
    case StockStatus.IN_STOCK:
      return 'EM ESTOQUE';
    default:
      return 'DESCONHECIDO';
  }
}

/**
 * Mapeia o StockStatus para cores CSS
 * @param status - Status do estoque
 * @returns Classe CSS para cor
 */
export function getStockStatusColor(status: StockStatus): string {
  switch (status) {
    case StockStatus.OUT_OF_STOCK:
      return 'bg-red-500';
    case StockStatus.LOW_STOCK:
      return 'bg-yellow-500';
    case StockStatus.IN_STOCK:
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
} 