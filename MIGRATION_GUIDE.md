# Guia de Migração para Supabase

Este guia foi criado para facilitar a migração do banco de dados do Render para o Supabase.

## 📋 Pré-requisitos

1. Acesso ao painel admin do sistema
2. Conta no Supabase configurada
3. Schema do Prisma atualizado para o Supabase

## 🔄 Passos para Migração

### 1. Gerar Schema e Backup dos Dados

1. Acesse o painel admin do sistema
2. Vá para o menu **"Backup (Temp)"** no sidebar
3. **Primeiro, clique em "Gerar Schema das Tabelas"** - isso criará o arquivo `schema-completo-YYYY-MM-DD.sql`
4. **Depois, clique em "Gerar Backup SQL"** - isso criará o arquivo `backup-completo-YYYY-MM-DD.sql`

### 2. Configurar Supabase

1. Crie um novo projeto no Supabase
2. Configure o banco PostgreSQL
3. Execute as migrações do Prisma no Supabase:
   ```bash
   npx prisma migrate deploy
   ```

### 3. Importar Schema e Dados no Supabase

1. Abra o painel do Supabase e vá para a seção **SQL Editor**
2. **Primeiro, execute o schema:**
   - Abra o arquivo `schema-completo-YYYY-MM-DD.sql` em um editor de texto
   - Copie todo o conteúdo do arquivo SQL
   - Cole o conteúdo no editor SQL do Supabase
   - Execute o script clicando em **"Run"**
3. **Depois, execute o backup dos dados:**
   - Abra o arquivo `backup-completo-YYYY-MM-DD.sql` em um editor de texto
   - Copie todo o conteúdo do arquivo SQL
   - Cole o conteúdo no editor SQL do Supabase
   - Execute o script clicando em **"Run"**

### 4. Atualizar Configurações

1. Atualize as variáveis de ambiente do backend:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database"
   ```

2. Atualize as variáveis de ambiente do frontend se necessário

### 5. Testar a Migração

1. Verifique se todos os dados foram migrados corretamente
2. Teste as funcionalidades principais do sistema
3. Confirme que os usuários conseguem fazer login

## 📁 Estrutura do Backup

O arquivo de backup contém:

- **Usuários**: Perfis, endereços e configurações
- **Produtos**: Catálogo completo com preços e estoque
- **Categorias**: Organização dos produtos
- **Pedidos**: Histórico completo de vendas
- **Combos e Doses**: Configurações especiais
- **Promoções**: Descontos e ofertas
- **Fornecedores**: Cadastro de fornecedores
- **Estoque**: Movimentações e entradas
- **Notificações**: Sistema de notificações

## ⚠️ Importante

- **Faça backup antes de executar o script de restauração**
- **O script limpa todos os dados existentes no banco de destino**
- **Teste em ambiente de desenvolvimento primeiro**
- **Mantenha o arquivo de backup em local seguro**

## 🧹 Limpeza Pós-Migração

Após confirmar que a migração foi bem-sucedida:

1. Remova o menu "Backup (Temp)" do sidebar
2. Remova a rota `/admin-backup` do sistema
3. Remova o endpoint `/admin/backup` do backend
4. Remova o arquivo `scripts/restore-backup.js` (opcional, já que agora usa SQL direto)

## 🔧 Solução de Problemas

### Erro de Conexão
- Verifique se a URL do banco está correta
- Confirme se as credenciais estão válidas

### Erro de Foreign Key
- O SQL gerado já está configurado para respeitar as dependências
- Se houver erro, verifique se o schema está correto

### Dados Duplicados
- O SQL limpa os dados antes de inserir
- Se necessário, limpe manualmente o banco antes

### Erro de Sintaxe SQL
- Verifique se o arquivo SQL foi copiado completamente
- Certifique-se de que não há caracteres especiais corrompidos

## 📞 Suporte

Em caso de problemas durante a migração, verifique:

1. Logs do SQL Editor do Supabase
2. Logs do backend
3. Configurações de conexão com o banco
4. Sintaxe do arquivo SQL gerado

---

**Data de criação**: $(date)
**Versão**: 1.0
**Status**: Temporário - Para ser removido após migração 