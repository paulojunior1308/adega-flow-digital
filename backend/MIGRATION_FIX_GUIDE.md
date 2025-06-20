# Guia para Resolver Migração Falhada no Render

## Problema
A migração `20250619143431_add_costprice_to_items_and_stockentry` falhou no Render porque tentou adicionar campos `NOT NULL` em tabelas que já tinham dados.

## Soluções Disponíveis

### Opção 1: Script Automático (Recomendado)

1. **Acesse o Console do Render:**
   - Vá para o painel do seu serviço no Render
   - Clique em "Console" ou "Shell"
   - Conecte-se ao terminal

2. **Execute o Script de Correção:**
   ```bash
   npm run fix:migration
   ```

3. **Marque a Migração como Resolvida:**
   - No painel do Render, vá em "Environment"
   - Adicione uma variável de ambiente temporária:
     ```
     PRISMA_MIGRATE_RESOLVE=true
     ```
   - Ou use o comando:
     ```bash
     npx prisma migrate resolve --applied 20250619143431_add_costprice_to_items_and_stockentry
     ```

### Opção 2: SQL Manual

Se o console não estiver disponível, execute este SQL diretamente no banco:

```sql
-- 1. Adicionar campos como nullable
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "costPrice" DOUBLE PRECISION;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "costPrice" DOUBLE PRECISION;

-- 2. Preencher dados
UPDATE "OrderItem" 
SET "costPrice" = p."costPrice"
FROM "Product" p
WHERE "OrderItem"."productId" = p.id 
  AND "OrderItem"."costPrice" IS NULL;

UPDATE "SaleItem" 
SET "costPrice" = p."costPrice"
FROM "Product" p
WHERE "SaleItem"."productId" = p.id 
  AND "SaleItem"."costPrice" IS NULL;

-- 3. Tornar obrigatórios
ALTER TABLE "OrderItem" ALTER COLUMN "costPrice" SET NOT NULL;
ALTER TABLE "SaleItem" ALTER COLUMN "costPrice" SET NOT NULL;

-- 4. Criar tabela StockEntry
CREATE TABLE IF NOT EXISTS "StockEntry" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "supplierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "StockEntry_pkey" PRIMARY KEY ("id")
);

-- 5. Adicionar foreign keys
ALTER TABLE "StockEntry" ADD CONSTRAINT IF NOT EXISTS "StockEntry_productId_fkey" 
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StockEntry" ADD CONSTRAINT IF NOT EXISTS "StockEntry_supplierId_fkey" 
FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

### Opção 3: Reset da Migração (Último Recurso)

Se nada funcionar, você pode resetar a migração:

1. **No painel do Render:**
   - Vá em "Environment"
   - Adicione: `PRISMA_MIGRATE_RESOLVE=true`

2. **Ou via comando:**
   ```bash
   npx prisma migrate resolve --rolled-back 20250619143431_add_costprice_to_items_and_stockentry
   ```

## Após a Correção

1. **Teste o Deploy:**
   - Faça um novo deploy no Render
   - Verifique se as migrações aplicam corretamente

2. **Verifique os Dados:**
   - Confirme que os campos `costPrice` foram preenchidos
   - Verifique se a tabela `StockEntry` foi criada

3. **Remova Variáveis Temporárias:**
   - Remova `PRISMA_MIGRATE_RESOLVE=true` se foi adicionada

## Logs Esperados

O script deve mostrar algo como:
```
🔧 Iniciando correção da migração falhada...
✅ costPrice já existe em OrderItem
✅ costPrice já existe em SaleItem
📊 Preenchendo dados de costPrice...
✅ OrderItems atualizados: 15
✅ SaleItems atualizados: 8
🔒 Tornando campos costPrice obrigatórios...
✅ Tabela StockEntry já existe
🎉 Migração falhada corrigida com sucesso!
```

## Suporte

Se ainda houver problemas, verifique:
- Logs do Render para erros específicos
- Status das migrações com `npx prisma migrate status`
- Estrutura atual do banco com `npx prisma db pull` 