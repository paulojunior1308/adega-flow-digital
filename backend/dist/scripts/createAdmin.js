"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = require("../config/bcrypt");
const prisma = new client_1.PrismaClient();
async function createAdmin() {
    try {
        const adminEmail = 'admin@adegaflow.com';
        const adminPassword = 'admin123';
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail },
        });
        if (existingAdmin) {
            console.log('Admin já existe!');
            return;
        }
        const hashedPassword = await (0, bcrypt_1.hashPassword)(adminPassword);
        const admin = await prisma.user.create({
            data: {
                name: 'Paulo Junior',
                email: adminEmail,
                password: hashedPassword,
                cpf: '12345678909',
                role: 'ADMIN',
                active: true,
            },
        });
        console.log('Admin criado com sucesso!');
        console.log('Email:', adminEmail);
        console.log('Senha:', adminPassword);
    }
    catch (error) {
        console.error('Erro ao criar admin:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
createAdmin();
