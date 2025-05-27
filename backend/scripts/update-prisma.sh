#!/bin/bash

# Gerar o Prisma Client atualizado
npx prisma generate

# Aplicar a migration
npx prisma migrate deploy

echo "Prisma Client atualizado com sucesso!" 