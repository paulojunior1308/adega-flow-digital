# Scripts do Backend

## updateProductMargins.ts

Este script calcula e atualiza automaticamente a margem de lucro de todos os produtos que ainda não possuem esse valor definido.

### O que o script faz:

1. **Busca produtos** que têm preço e custo definidos, mas margem nula
2. **Calcula a margem** usando a fórmula: `margem = ((preço / custo) - 1) * 100`
3. **Atualiza o banco** com a margem calculada (arredondada para 2 casas decimais)
4. **Exibe relatório** detalhado do processo

### Como executar:

```bash
# Na pasta backend
npm run update:margins
```

## fillCostPriceData.ts

Este script preenche automaticamente os campos `costPrice` dos itens de venda e pedidos que ainda não possuem esse valor.

### O que o script faz:

1. **Busca itens** de `SaleItem` e `OrderItem` com `costPrice` nulo
2. **Obtém o custo atual** do produto relacionado
3. **Atualiza o item** com o custo do produto
4. **Exibe relatório** detalhado do processo

### Como executar:

```bash
# Na pasta backend
npm run fill:costprice
```

### Exemplo de saída:

```
🚀 Iniciando preenchimento dos dados de costPrice...
📊 Encontrados 5 itens de venda para atualizar
✅ SaleItem Cerveja Heineken: costPrice = 5.20
✅ SaleItem Whisky Jack Daniels: costPrice = 28.00
📊 Encontrados 3 itens de pedido para atualizar
✅ OrderItem Vodka Absolut: costPrice = 22.50

📈 Resumo da atualização de costPrice:
✅ SaleItems atualizados: 5
✅ OrderItems atualizados: 3
📊 Total processado: 8

🎉 Todos os costPrice foram preenchidos com sucesso!
```

### Quando usar:

- **Após migrações** que adicionam o campo `costPrice`
- **Quando itens antigos** não possuem custo registrado
- **Para garantir consistência** dos dados financeiros

## Execução Automática no Render

Ambos os scripts são executados automaticamente no `seed.ts` durante o deploy no Render:

1. **fillCostPriceData()** - Preenche custos dos itens existentes
2. **updateProductMargins()** - Calcula margens dos produtos

### Segurança:

- Os scripts só atualizam registros que realmente precisam
- Usam transações seguras do banco de dados
- Exibem relatórios detalhados de todas as operações
- Não afetam dados que já estão corretos

### Importante:

⚠️ **Execute estes scripts apenas quando necessário** após atualizações que afetam esses campos. No Render, eles rodam automaticamente no deploy. 