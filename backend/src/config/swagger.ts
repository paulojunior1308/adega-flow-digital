import { env } from './env';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'API do Sistema PDV - Adega Flow',
    version: '1.0.0',
    description: 'Documentação da API do Sistema PDV - Adega Flow',
  },
  servers: [
    {
      url: `https://adega-flow-digital.onrender.com`,
      description: 'Servidor de Produção',
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