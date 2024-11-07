const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Bookstore API Documentation (Book Service)',
            version: '1.0.0',
            description: 'Documentation for the Book Service API',
            contact: {
                name: 'Mehretu Abreham',
                email: 'mehertu.abreham@gmail.com'
            }
        },
        servers: [
            {
                url: '/api',
                description: 'Book Service API'
            }
        ],
        components: {
            schemas: {
                BookInput: {
                    type: 'object',
                    required: ['title', 'isbn', 'author', 'description', 'category', 'price'],
                    properties: {
                        title: {
                            type: 'string',
                            example: 'The Great Gatsby'
                        },
                        isbn: {
                            type: 'string',
                            example: '978-3-16-148410-0'
                        },
                        author: {
                            type: 'string',
                            example: 'F. Scott Fitzgerald'
                        },
                        description: {
                            type: 'string',
                            example: 'A story about the American Dream'
                        },
                        category: {
                            type: 'string',
                            enum: ['FICTION', 'NON_FICTION', 'BIOGRAPHY', 'SELF_HELP', 'TECHNOLOGY', 'HISTORY', 'MATH', 'SCIENCE', 'RELIGION', 'OTHER']
                        },
                        price: {
                            type: 'number',
                            example: 29.99
                        },
                        metadata: {
                            type: 'object',
                            properties: {
                                genre: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    example: ['Classic', 'Literary Fiction']
                                }
                            }
                        }
                    }
                },
                Book: {
                    allOf: [
                        { $ref: '#/components/schemas/BookInput' },
                        {
                            type: 'object',
                            properties: {
                                _id: {
                                    type: 'string',
                                    example: '507f1f77bcf86cd799439011'
                                },
                                metadata: {
                                    type: 'object',
                                    properties: {
                                        popularity: {
                                            type: 'object',
                                            properties: {
                                                rating: {
                                                    type: 'number',
                                                    example: 4.5
                                                },
                                                reviewCount: {
                                                    type: 'number',
                                                    example: 42
                                                }
                                            }
                                        }
                                    }
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
                },
                ReviewInput: {
                    type: 'object',
                    required: ['rating', 'comment'],
                    properties: {
                        rating: {
                            type: 'number',
                            minimum: 1,
                            maximum: 5,
                            example: 4
                        },
                        comment: {
                            type: 'string',
                            example: 'A fantastic read!'
                        }
                    }
                },
                Review: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439012'
                        },
                        bookId: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                        },
                        userId: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439013'
                        },
                        rating: {
                            type: 'number',
                            minimum: 1,
                            maximum: 5
                        },
                        comment: {
                            type: 'string'
                        },
                        votes: {
                            type: 'object',
                            properties: {
                                upvotes: {
                                    type: 'array',
                                    items: { type: 'string' }
                                },
                                downvotes: {
                                    type: 'array',
                                    items: { type: 'string' }
                                }
                            }
                        },
                        reported: {
                            type: 'object',
                            properties: {
                                isReported: {
                                    type: 'boolean'
                                },
                                reports: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            userId: { type: 'string' },
                                            reason: { type: 'string' },
                                            timestamp: { 
                                                type: 'string',
                                                format: 'date-time'
                                            }
                                        }
                                    }
                                },
                                status: {
                                    type: 'string',
                                    enum: ['PENDING', 'REVIEWED', 'RESOLVED']
                                }
                            }
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
};

const specs = swaggerJsdoc(options);
module.exports = specs;