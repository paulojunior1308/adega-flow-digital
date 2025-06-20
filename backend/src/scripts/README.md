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

### Exemplo de saída:

```
🚀 Iniciando atualização das margens dos produtos...
📊 Encontrados 15 produtos para atualizar
✅ Cerveja Heineken: 8.50 / 5.20 = 63.46%
✅ Whisky Jack Daniels: 45.00 / 28.00 = 60.71%
✅ Vodka Absolut: 35.00 / 22.50 = 55.56%

📈 Resumo da atualização:
✅ Produtos atualizados: 15
❌ Erros: 0
📊 Total processado: 15

🎉 Todas as margens foram atualizadas com sucesso!
```

### Quando usar:

- **Após subir uma nova versão** para produção que inclui o campo `margin`
- **Quando produtos antigos** não possuem margem definida
- **Para padronizar** os dados de margem em todo o sistema

### Segurança:

- O script só atualiza produtos que têm preço e custo válidos (> 0)
- Não altera produtos que já possuem margem definida
- Usa transações seguras do banco de dados
- Exibe relatório detalhado de todas as operações

### Importante:

⚠️ **Execute este script apenas UMA VEZ** após a atualização para produção. Não é necessário rodar novamente a menos que novos produtos sejam adicionados sem margem. 