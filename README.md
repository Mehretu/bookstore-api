# Bookstore Microservices Documentation
## Service Overview
### 1. API Gateway (Port: 9000)
- Single entry point for all client requests
- Route management
- Rate limiting
- Request logging
### 2. Auth Service (Port: 5000)
- User authentication and token generation
- JWT token verification
- User registration and login
- Password hashing and salting
- Service account management
### 3. Book Service (Port: 8080)
- Book management and retrieval
- Integration with external API
- Caching mechanisms
- Error handling and logging
- Bulk operations support
### 4. Integration Service (Port: 8000)
- External API integration
- Authentication with Auth Service
- Request forwarding and response handling
- Error handling and logging
- Service token management
- Cross-service data synchronization
### 5. Notification Service (Port: 6001)
- Event-based notifications
- Real-time updates
## Technology Stack
### Core Technologies
- **Runtime**: Node.js
- **Framework**: Express
- **Gateway**: Express Gateway
- **Database**: MongoDB
- **Caching**: Redis
- **API Documentation**: Swagger
- **Message Queue**: RabbitMQ
- **Secret Management**: Vault
### Common Libraries
- **Validation**: Joi
- **Error Handling**: http-errors
- **HTTP Client**: axios
- **Documentation**: swagger-jsdoc, swagger-ui-express
## Service Communication
### Authentication Flow
![Authentication Flow](./docs/images/auth-service-flow.png)

