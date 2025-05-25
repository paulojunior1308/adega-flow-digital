"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const env_1 = require("./env");
exports.swaggerSpec = {
    openapi: '3.0.0',
    info: {
        title: 'API do Sistema PDV - Adega Flow',
        version: '1.0.0',
        description: 'Documentação da API do Sistema PDV - Adega Flow',
    },
    servers: [
        {
            url: `http://localhost:${env_1.env.port}`,
            description: 'Servidor de Desenvolvimento',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
    paths: {
        '/': {
            get: {
                summary: 'Rota inicial',
                description: 'Retorna uma mensagem de boas-vindas',
                responses: {
                    '200': {
                        description: 'Mensagem de boas-vindas',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: {
                                            type: 'string',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};
