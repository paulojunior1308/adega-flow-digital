import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../config/bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const adminEmail = 'admin@adegaflow.com';
    const adminPassword = 'admin123';
    const adminCPF = '00000000191'; // CPF padrão para o primeiro admin

    // Verificar se já existe um admin
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: adminEmail },
          { cpf: adminCPF }
        ]
      }
    });

    if (existingAdmin) {
      console.log('Admin já existe!');
      return;
    }

    // Criar admin
    const hashedPassword = await hashPassword(adminPassword);
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        cpf: adminCPF
      },
    });

    console.log('Admin criado com sucesso!');
    console.log('Email:', adminEmail);
    console.log('Senha:', adminPassword);
    console.log('CPF:', adminCPF);
  } catch (error) {
    console.error('Erro ao criar admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 