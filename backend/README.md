# Backend do Sistema PDV - Adega Flow

Backend do sistema PDV desenvolvido para adegas e comércios pequenos, construído com Node.js, Express, TypeScript e Prisma ORM.

## Requisitos

- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Copie o arquivo `.env.example` para `.env` e configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Configure a conexão com o banco de dados no arquivo `.env`

5. Execute as migrações do banco de dados:
```bash
npm run prisma:migrate
```

6. Gere o cliente Prisma:
```bash
npm run prisma:generate
```

## Desenvolvimento

Para iniciar o servidor em modo de desenvolvimento:
```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3333`

## Scripts Disponíveis

- `npm run dev`: Inicia o servidor em modo de desenvolvimento
- `npm run build`: Compila o projeto TypeScript
- `npm run start`: Inicia o servidor em modo de produção
- `npm run prisma:generate`: Gera o cliente Prisma
- `npm run prisma:migrate`: Executa as migrações do banco de dados
- `npm run prisma:studio`: Abre o Prisma Studio para gerenciar o banco de dados

## Estrutura do Projeto

```
src/
  ├── config/         # Configurações da aplicação
  ├── controllers/    # Controladores das rotas
  ├── middlewares/    # Middlewares da aplicação
  ├── routes/         # Definição das rotas
  ├── services/       # Lógica de negócio
  ├── utils/          # Funções utilitárias
  └── server.ts       # Arquivo principal
```

## Funcionalidades

- Autenticação com JWT
- Cadastro e gerenciamento de produtos
- Cadastro e gerenciamento de clientes
- Cadastro de fornecedores
- Controle de vendas
- Abertura/fechamento de caixa
- Relatórios de vendas
- Controle de estoque
- Gestão de kits/produtos fracionados
- Controle de comissões
- Integração com NFC-e/SAT (placeholder)
- Portal do contador
- Suporte a múltiplos usuários

## Deploy

O projeto está configurado para deploy na Railway ou Render. Basta conectar o repositório e configurar as variáveis de ambiente necessárias.

## Licença

ISC 

O frontend estará disponível em `https://adega-element.netlify.app` 