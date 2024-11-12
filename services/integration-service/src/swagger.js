const swaggerJsdoc = require('swagger-jsdoc')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bookstore Integrator API',
      version: '1.0.0',
      description: 'API documentation for the Bookstore Integration Service',
    },
    servers: [
      {
        url: 'http://localhost:8000/api',
        description: 'Integrator',
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
  },
  apis: ['./src/Routes/*.js'], 
}

module.exports = swaggerJsdoc(options)