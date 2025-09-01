# Guia de Gerenciamento de Vendas

## Funcionalidades Implementadas

### 1. Cancelamento de Vendas

**Descrição:** Permite cancelar vendas já realizadas, restaurando automaticamente o estoque dos produtos.

**Como usar:**
1. Acesse a página "Vendas" no painel administrativo
2. Localize a venda que deseja cancelar
3. Clique no botão "Cancelar" (ícone X vermelho) na tabela ou no modal de detalhes
4. Confirme a ação no popup de confirmação
5. O sistema irá:
   - Restaurar o estoque de todos os produtos da venda
   - Alterar o status da venda para "Cancelada"
   - Registrar as movimentações de estoque para auditoria

**Restrições:**
- Apenas vendas do PDV podem ser canceladas
- Vendas já canceladas não podem ser canceladas novamente
- Vendas online não podem ser canceladas por esta funcionalidade

### 2. Edição de Vendas

**Descrição:** Permite editar os itens de uma venda, ajustando automaticamente o estoque.

**Como usar:**
1. Acesse a página "Vendas" no painel administrativo
2. Localize a venda que deseja editar
3. Clique no botão "Editar" (ícone de lápis) na tabela ou no modal de detalhes
4. No modal de edição:
   - Adicione, remova ou modifique itens
   - Ajuste quantidades e preços
   - Aplique descontos se necessário
5. Clique em "Salvar Alterações"
6. O sistema irá:
   - Restaurar o estoque dos itens originais
   - Verificar disponibilidade dos novos itens
   - Descontar o estoque dos novos itens
   - Atualizar a venda com os novos dados
   - Registrar todas as movimentações de estoque

**Restrições:**
- Apenas vendas do PDV podem ser editadas
- Vendas canceladas não podem ser editadas
- É necessário ter estoque suficiente para os novos itens

## Controle de Estoque

### Produtos Fracionados vs. Unidades

O sistema diferencia automaticamente entre produtos fracionados e produtos por unidade:

**Produtos Fracionados:**
- Controlados por volume (ml, litros, etc.)
- Exemplo: bebidas, destilados
- O sistema desconta/restaura o volume total
- O estoque em unidades é calculado automaticamente

**Produtos por Unidade:**
- Controlados por quantidade de unidades
- Exemplo: latas, garrafas, pacotes
- O sistema desconta/restaura unidades diretamente

### Movimentações de Estoque

Todas as operações são registradas na tabela `StockMovement` com as seguintes informações:
- Tipo: 'in' (entrada) ou 'out' (saída)
- Quantidade movimentada
- Custo unitário e total
- Origem da movimentação
- Observações detalhadas

**Origens registradas:**
- `cancelamento_venda`: Restauração de estoque por cancelamento
- `edicao_venda`: Restauração de estoque por edição
- `venda_pdv`: Desconto de estoque por venda normal
- `venda_pdv_editada`: Desconto de estoque por venda editada

## Segurança e Auditoria

### Transações de Banco de Dados

Todas as operações de cancelamento e edição são executadas dentro de transações de banco de dados para garantir:
- Consistência dos dados
- Rollback automático em caso de erro
- Integridade do estoque

### Validações

O sistema realiza as seguintes validações:
- Verificação de existência da venda
- Verificação de status da venda
- Verificação de disponibilidade de estoque
- Validação de dados dos itens

### Logs e Rastreabilidade

Todas as operações são registradas com:
- Timestamp da operação
- Usuário que realizou a operação
- Detalhes completos da operação
- Movimentações de estoque associadas

## Interface do Usuário

### Página de Vendas

A página de vendas foi atualizada com:
- Botões de ação na tabela principal
- Botões de ação no modal de detalhes
- Indicadores visuais de status
- Confirmações antes de ações críticas

### Modal de Edição

O modal de edição inclui:
- Lista editável de itens
- Seleção de produtos com preços
- Campos para quantidade e desconto
- Cálculo automático de subtotais
- Validação em tempo real

## API Endpoints

### Cancelar Venda
```
PATCH /admin/pdv-sales/:id/cancel
```

### Editar Venda
```
PUT /admin/pdv-sales/:id
Body: {
  items: [
    {
      productId: string,
      quantity: number,
      price: number,
      discount?: number,
      isDoseItem?: boolean,
      isFractioned?: boolean,
      discountBy?: string,
      choosableSelections?: any,
      comboInstanceId?: string,
      doseInstanceId?: string,
      doseId?: string
    }
  ],
  paymentMethodId?: string
}
```

## Considerações Importantes

1. **Backup:** Sempre faça backup antes de operações críticas
2. **Testes:** Teste as funcionalidades em ambiente de desenvolvimento
3. **Monitoramento:** Monitore as movimentações de estoque regularmente
4. **Treinamento:** Treine os usuários sobre o uso correto das funcionalidades
5. **Auditoria:** Revise periodicamente os logs de movimentação

## Suporte

Em caso de dúvidas ou problemas:
1. Verifique os logs do sistema
2. Consulte as movimentações de estoque
3. Entre em contato com o suporte técnico
4. Documente o problema para análise 