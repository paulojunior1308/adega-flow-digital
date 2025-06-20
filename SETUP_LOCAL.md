# 🚀 Configuração Local - Adega Flow Digital

## ✅ Problemas Resolvidos

1. **CORS Configurado**: O backend agora aceita requisições de `http://localhost:8080` e domínios de produção
2. **URLs Dinâmicas**: Todos os arquivos do frontend agora usam `VITE_API_URL` em vez de URLs hardcoded
3. **Scripts de Desenvolvimento**: Criados scripts para facilitar o desenvolvimento

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

## 🔧 Configuração Passo a Passo

### 1. Instalar Dependências
```bash
npm run install:all
```

### 2. Configurar Banco de Dados
1. Crie um banco PostgreSQL local chamado `adega_flow`
2. Copie o arquivo de exemplo do backend:
```bash
cp backend/env.example backend/.env
```
3. Edite `backend/.env` e configure:
```env
DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/adega_flow?schema=public"
JWT_SECRET="sua-chave-secreta-aqui"
FRONTEND_URL="http://localhost:8080"
```

### 3. Configurar Frontend
1. Copie o arquivo de exemplo do frontend:
```bash
cp frontend/env.example frontend/.env
```
2. O arquivo já está configurado para apontar para o backend local

### 4. Configurar Banco
```bash
cd backend
npm run prisma:migrate
npm run prisma:generate
```

### 5. Rodar o Sistema
```bash
# Opção 1: Rodar tudo de uma vez
npm run dev

# Opção 2: Rodar separadamente
npm run dev:backend  # Backend na porta 3333
npm run dev:frontend # Frontend na porta 8080
```

## 🌐 URLs de Acesso

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3333
- **Documentação API**: http://localhost:3333/api-docs

## 🔍 Verificação

Para verificar se tudo está funcionando:

1. **Backend**: Acesse http://localhost:3333 - deve mostrar "API do Sistema PDV - Adega Flow"
2. **Frontend**: Acesse http://localhost:8080 - deve carregar a aplicação
3. **CORS**: O frontend deve conseguir fazer requisições para o backend sem erros

## 🚨 Solução de Problemas

### Erro de CORS
- Verifique se o backend está rodando na porta 3333
- Verifique se o frontend está rodando na porta 8080
- Verifique se o arquivo `backend/.env` tem `FRONTEND_URL="http://localhost:8080"`

### Erro de Banco de Dados
- Verifique se o PostgreSQL está rodando
- Verifique se a URL do banco em `backend/.env` está correta
- Execute `npm run prisma:migrate` no backend

### Erro de Dependências
- Execute `npm run install:all` para instalar todas as dependências
- Verifique se o Node.js é versão 18+

## 📝 Scripts Disponíveis

- `npm run dev`: Roda backend e frontend simultaneamente
- `npm run dev:backend`: Roda apenas o backend
- `npm run dev:frontend`: Roda apenas o frontend
- `npm run install:all`: Instala todas as dependências
- `npm run build`: Compila backend e frontend para produção

## 🔄 Produção

Para produção, configure as variáveis de ambiente:
- `FRONTEND_URL`: URL do frontend em produção
- `VITE_API_URL`: URL do backend em produção
- `DATABASE_URL`: URL do banco PostgreSQL em produção 