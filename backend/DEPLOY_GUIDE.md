# Guia de Deploy Seguro - Funcionalidade de Ofertas

## 📋 Pré-requisitos

1. **Backup completo do banco de produção**
2. **Acesso ao servidor de produção**
3. **Tempo de manutenção agendado** (recomendado: horário de baixo movimento)

## 🚀 Passo a Passo do Deploy

### 1. **Backup do Banco de Dados**
```bash
# No servidor de produção, faça backup completo
pg_dump -h [HOST] -U [USER] -d [DATABASE] > backup_antes_ofertas_$(date +%Y%m%d_%H%M%S).sql
```

### 2. **Upload dos Novos Arquivos**
```bash
# Faça upload dos arquivos atualizados para o servidor
# - Controllers atualizados (admin.ts, finance.ts)
# - Scripts de limpeza
# - Novas migrations (se houver)
```

### 3. **Executar Migrations**
```bash
# No servidor de produção
cd /path/to/backend
npx prisma migrate deploy
npx prisma generate
```

### 4. **Limpeza de Registros Órfãos (Opcional mas Recomendado)**
```bash
# Execute o script de limpeza
node scripts/clean-orphaned-records-production.js
```

### 5. **Reiniciar o Backend**
```bash
# Reinicie o serviço do backend
pm2 restart [app-name]
# ou
systemctl restart [service-name]
```

### 6. **Testes Pós-Deploy**
- [ ] Verificar se o backend está rodando
- [ ] Testar criação de oferta
- [ ] Testar venda de oferta
- [ ] Verificar se o estoque é descontado corretamente
- [ ] Verificar se a venda aparece na listagem

## ⚠️ Pontos de Atenção

### **Riscos Identificados**
1. **Registros órfãos**: Se existirem vendas/pedidos com produtos deletados, podem causar erro 500
2. **Dados antigos**: Vendas antigas não terão referência para ofertas (isso é normal)

### **Mitigações Implementadas**
1. **Filtros de segurança**: Controllers agora filtram itens com produtos nulos
2. **Script de limpeza**: Remove registros órfãos automaticamente
3. **Tratamento de erros**: Try/catch em todas as queries críticas

## 🔧 Rollback (Se Necessário)

### **Cenário 1: Problema com Migrations**
```bash
# Reverter para migration anterior
npx prisma migrate reset --force
# Restaurar backup
psql -h [HOST] -U [USER] -d [DATABASE] < backup_antes_ofertas_*.sql
```

### **Cenário 2: Problema com Código**
```bash
# Reverter para versão anterior do código
git checkout [commit-anterior]
# Reiniciar backend
pm2 restart [app-name]
```

## 📊 Monitoramento Pós-Deploy

### **Logs para Acompanhar**
```bash
# Verificar logs do backend
pm2 logs [app-name]
# ou
tail -f /var/log/backend/error.log
```

### **Métricas para Verificar**
- [ ] Taxa de erro 500 nas páginas de vendas/financeiro
- [ ] Tempo de resposta das APIs
- [ ] Funcionamento das vendas de ofertas
- [ ] Desconto correto de estoque

## 🆘 Troubleshooting

### **Erro: "Field product is required to return data, got null instead"**
**Causa**: Registros órfãos no banco
**Solução**: Executar script de limpeza
```bash
node scripts/clean-orphaned-records-production.js
```

### **Erro: "Table 'Offer' does not exist"**
**Causa**: Migration não foi aplicada
**Solução**: Executar migrations
```bash
npx prisma migrate deploy
```

### **Venda de oferta não desconta estoque**
**Causa**: Lógica de processamento de ofertas não está funcionando
**Solução**: Verificar logs do PDV e ajustar código se necessário

## 📞 Contatos de Emergência

- **Desenvolvedor**: [Seu contato]
- **DBA**: [Contato do DBA]
- **DevOps**: [Contato do DevOps]

## 📝 Checklist Final

- [ ] Backup realizado
- [ ] Migrations aplicadas
- [ ] Script de limpeza executado
- [ ] Backend reiniciado
- [ ] Testes básicos realizados
- [ ] Monitoramento ativo
- [ ] Documentação atualizada

---

**⚠️ IMPORTANTE**: Sempre mantenha um backup recente e tenha um plano de rollback preparado antes de qualquer deploy em produção. 