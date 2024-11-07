const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bookstore API Documentation',
      version: '1.0.0',
      description: 'Documentation for the Bookstore Microservices API',
      contact: {
        name: 'Mehretu Abreham',
        email: 'mehertu.abreham@gmail.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Auth Service'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [
    './helpers/swagger-docs/*.yml',
    './Routes/*.js'
  ]
};

const specs = swaggerJsdoc(options);
module.exports = specs;