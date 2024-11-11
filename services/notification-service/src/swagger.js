const path = require('path')
const swaggerJsdoc = require('swagger-jsdoc')

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Bookstore API Documentation (Notification Service)',
            version: '1.0.0',
            description: 'Documentation for the Notification Service API',
            contact: {
                name: 'Mehretu Abreham',
                email: 'mehertu.abreham@gmail.com'
            }
        },
        servers: [
            {
                url: '/api',
                description: 'Notification Service API'
            }
        ],
        components: {
            schemas: {
                NotificationInput: {
                    type: 'object',
                    required: ['userId', 'type', 'data'],
                    properties: {
                        userId: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439013'
                        },
                        type: {
                            type: 'string',
                            enum: ['NEW_BOOK', 'PRICE_DROP', 'NEW_REVIEW'],
                            example: 'NEW_BOOK'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                bookId: {
                                    type: 'string',
                                    example: '507f1f77bcf86cd799439011'
                                },
                                title: {
                                    type: 'string',
                                    example: 'The Great Gatsby'
                                },
                                author: {
                                    type: 'string',
                                    example: 'F. Scott Fitzgerald'
                                },
                                category: {
                                    type: 'string',
                                    enum: ['FICTION', 'NON_FICTION', 'BIOGRAPHY', 'SELF_HELP', 'TECHNOLOGY', 'HISTORY', 'MATH', 'SCIENCE', 'RELIGION', 'OTHER']
                                },
                                price: {
                                    type: 'number',
                                    example: 29.99
                                },
                                genre: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    example: ['Classic', 'Literary Fiction']
                                },
                                rating: {
                                    type: 'number',
                                    example: 4.5
                                },
                                message: {
                                    type: 'string',
                                    example: 'New book added in your favorite category!'
                                }
                            }
                        }
                    }
                },
                Notification: {
                    allOf: [
                        { $ref: '#/components/schemas/NotificationInput' },
                        {
                            type: 'object',
                            properties: {
                                _id: {
                                    type: 'string',
                                    example: '507f1f77bcf86cd799439014'
                                },
                                read: {
                                    type: 'boolean',
                                    default: false
                                },
                                createdAt: {
                                    type: 'string',
                                    format: 'date-time'
                                },
                                updatedAt: {
                                    type: 'string',
                                    format: 'date-time'
                                }
                            }
                        }
                    ]
                }
            },
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
        path.join(__dirname, 'Routes/*.js'),
        path.join(__dirname, 'helpers/swagger-docs/*.yml')
    ]
}

const specs = swaggerJsdoc(options)
module.exports = specs