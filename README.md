# Adega Flow Digital - Sistema PDV

Sistema PDV completo para adegas e comércios pequenos, desenvolvido com Node.js, Express, TypeScript, React e Prisma.

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

### 1. Instalação das Dependências
```bash
npm run install:all
```

### 2. Configuração do Banco de Dados
1. Crie um banco PostgreSQL local chamado `adega_flow`
2. Copie o arquivo de exemplo do backend:
```bash
cp backend/env.example backend/.env
```
3. Edite o arquivo `backend/.env` e configure a URL do banco:
```
DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/adega_flow?schema=public"
```

### 3. Configuração do Frontend
1. Copie o arquivo de exemplo do frontend:
```bash
cp frontend/env.example frontend/.env
```
2. O arquivo `frontend/.env` já está configurado para apontar para o backend local.

### 4. Configuração do Banco
```bash
cd backend
npm run prisma:migrate
npm run prisma:generate
```

### 5. Rodar o Sistema
```bash
# Rodar backend e frontend simultaneamente
npm run dev

# Ou rodar separadamente:
npm run dev:backend  # Backend na porta 3333
npm run dev:frontend # Frontend na porta 8080
```

## 🌐 URLs de Acesso
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3333
- **Documentação API**: http://localhost:3333/api-docs

## 🔧 Configurações de Produção

### Backend (Render/Railway)
- `FRONTEND_URL`: URL do frontend em produção
- `DATABASE_URL`: URL do banco PostgreSQL em produção
- `JWT_SECRET`: Chave secreta para JWT
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: Configurações do Redis

### Frontend (Netlify/Vercel)
- `VITE_API_URL`: URL do backend em produção
- `VITE_GOOGLE_MAPS_API_KEY`: Chave da API do Google Maps
- `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`: Configurações do Cloudinary

## 📁 Estrutura do Projeto
```
├── backend/          # API Node.js + Express + TypeScript
├── frontend/         # React + Vite + TypeScript
├── package.json      # Scripts para desenvolvimento
└── README.md         # Este arquivo
```

## 🔒 CORS
O sistema está configurado para aceitar requisições de:
- `http://localhost:8080` (desenvolvimento local)
- Domínios configurados em `FRONTEND_URL` (produção)

## 🚀 Deploy
- **Frontend**: Conecte o repositório ao Netlify/Vercel
- **Backend**: Conecte o repositório ao Render/Railway
- Configure as variáveis de ambiente conforme necessário

## 📝 Licença
ISC 