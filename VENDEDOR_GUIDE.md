# Guia do Sistema de Vendedor

## Visão Geral

O sistema de vendedor foi implementado para permitir que usuários com o role `VENDEDOR` tenham acesso controlado a funcionalidades específicas do sistema, focadas em vendas e gestão de estoque.

## Funcionalidades Disponíveis

### 1. Dashboard do Vendedor (`/vendedor/dashboard`)
- **Visão geral das estatísticas**: Total de produtos, produtos com estoque baixo, categorias ativas
- **Vendas recentes**: Últimas vendas realizadas pelo vendedor
- **Ações rápidas**: Links diretos para as principais funcionalidades
- **Alertas de estoque**: Produtos que precisam de atenção

### 2. Controle de Estoque (`/vendedor/estoque`)
- **Visualização de produtos**: Lista todos os produtos com informações de estoque
- **Filtros avançados**: Por categoria, status do estoque, busca por nome
- **Status do estoque**: Visualização clara do status (Em estoque, Estoque baixo, Esgotado)
- **Paginação**: Navegação eficiente através de grandes listas de produtos

### 3. Cadastro de Produtos (`/vendedor/produtos`)
- **Gestão de produtos**: Visualização e edição básica de produtos
- **Filtros e busca**: Encontrar produtos rapidamente
- **Controle de status**: Ativar/desativar produtos
- **Informações detalhadas**: Preço, estoque, categoria, fornecedor

### 4. PDV - Ponto de Venda (`/vendedor/pdv`)
- **Sistema de vendas**: Interface completa para vendas presenciais
- **Carrinho de compras**: Adicionar/remover produtos, ajustar quantidades
- **Seleção de cliente**: Associar vendas a clientes específicos
- **Métodos de pagamento**: Dinheiro, cartão, PIX
- **Controle de estoque**: Verificação automática de disponibilidade

## Controle de Acesso

### Permissões do Vendedor
- ✅ **Visualizar** produtos e estoque
- ✅ **Realizar vendas** através do PDV
- ✅ **Consultar** categorias e fornecedores
- ✅ **Acessar** dashboard com estatísticas
- ❌ **Não pode** criar/editar produtos (apenas visualizar)
- ❌ **Não pode** acessar funcionalidades administrativas
- ❌ **Não pode** gerenciar usuários ou configurações

### Rotas Protegidas
Todas as rotas do vendedor são protegidas pelo middleware de autenticação e só podem ser acessadas por usuários com role `VENDEDOR`.

## Estrutura Técnica

### Backend
- **Middleware**: `vendedorMiddleware` e `vendedorOrAdminMiddleware`
- **Controller**: `vendedorController` com todas as operações
- **Rotas**: `/vendedor/*` com autenticação obrigatória
- **Banco de dados**: Role `VENDEDOR` adicionado ao enum `Role`

### Frontend
- **Layout**: `VendedorLayout` com sidebar específica
- **Páginas**: Dashboard, Estoque, Produtos, PDV
- **Autenticação**: Integrado com `useAuth` hook
- **Proteção**: `ProtectedRoute` com role `VENDEDOR`

## Como Usar

### 1. Login
- Acesse `/login`
- Use as credenciais do vendedor:
  - **Email**: `vendedor@elementadega.com`
  - **Senha**: `vendedor123`
- Será redirecionado automaticamente para `/vendedor/dashboard`

### 2. Navegação
- Use a sidebar para navegar entre as funcionalidades
- O dashboard centraliza as informações mais importantes
- Todas as páginas têm filtros e busca para facilitar o uso

### 3. Realizar Vendas
1. Acesse o PDV (`/vendedor/pdv`)
2. Busque e adicione produtos ao carrinho
3. Selecione o cliente (opcional)
4. Escolha o método de pagamento
5. Finalize a venda

## Configuração

### Criar Novo Vendedor
```bash
# No diretório backend
npx ts-node src/scripts/createVendedor.ts
```

### Atualizar Permissões
Para modificar as permissões do vendedor, edite:
- `backend/src/middlewares/vendedor.ts` - Middleware de autorização
- `backend/src/controllers/vendedor.ts` - Lógica de negócio
- `frontend/src/components/vendedor/VendedorLayout.tsx` - Menu de navegação

## Monitoramento

### Logs
- Todas as ações do vendedor são logadas no sistema
- Vendas são registradas com o ID do vendedor
- Movimentações de estoque são rastreadas

### Relatórios
- Dashboard mostra estatísticas em tempo real
- Vendas são associadas ao vendedor responsável
- Histórico de vendas disponível na interface

## Segurança

- **Autenticação obrigatória**: Todas as rotas requerem login
- **Autorização por role**: Apenas vendedores podem acessar
- **Validação de dados**: Todas as entradas são validadas
- **Controle de estoque**: Verificação automática de disponibilidade
- **Logs de auditoria**: Rastreamento de todas as operações

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs do sistema
2. Confirme as permissões do usuário
3. Teste a conectividade com o banco de dados
4. Consulte a documentação da API

---

**Nota**: Este sistema foi desenvolvido para atender às necessidades específicas de vendedores, mantendo a segurança e integridade dos dados do sistema principal.
