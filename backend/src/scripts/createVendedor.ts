import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createVendedor() {
  try {
    // Verificar se já existe um vendedor
    const existingVendedor = await prisma.user.findFirst({
      where: { role: 'VENDEDOR' }
    });

    if (existingVendedor) {
      console.log('Vendedor já existe:', existingVendedor.email);
      return;
    }

    // Criar vendedor
    const hashedPassword = await bcrypt.hash('vendedor123', 10);
    
    const vendedor = await prisma.user.create({
      data: {
        name: 'Vendedor Teste',
        email: 'vendedor@elementadega.com',
        cpf: '12345678901',
        password: hashedPassword,
        role: 'VENDEDOR',
        phone: '11999999999'
      }
    });

    console.log('Vendedor criado com sucesso:');
    console.log('Email:', vendedor.email);
    console.log('Senha: vendedor123');
    console.log('Role:', vendedor.role);
  } catch (error) {
    console.error('Erro ao criar vendedor:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createVendedor();
