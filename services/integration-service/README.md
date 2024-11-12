# Bookstore Integrator Service Documentation

## Service Overview

The Integrator Service acts as a bridge between different services in the Bookstore API ecosystem. It provides a unified interface for service-to-service communication, particularly focusing on book-related operations.
## Technical Stack
- Runtime: Node.js
- Framework: Express.js
- Authentication: JWT
- Secret Management: HashiCorp Vault
- Documentation: Swagger/OpenAPI
- HTTP Client: Axios

## Project Structure
```bash
services/integration-service/
├── src/
│   ├── controllers/
│   │   └── Integration.controller.js
│   ├── helpers/
│   │   └── vault-helper.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── routes/
│   │   └── Integration.route.js
│   ├── docs/
│   │   └── swagger.js
│   ├── scripts/
│   │   └── dev-setup.sh
│   ├── app.js
│   └── server.js
├── .env
└── package.json
```
## Setup and Installation
### Prerequisites
- Node.js and npm installed
- Vault instance running
- Book Service running
- Auth Service running

### Environment Variables
```bash
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=your-token
```
### Installation steps
```bash
# Clone repository (if not already done)
git clone <repository_url>

# Navigate to service directory
cd services/integration-service

# Install dependencies
npm install

# Setup development environment
npm run setup

# Start service
npm start
```
## API Endpoints
### Health Check
```bash
GET /api/health
```
### Response:
```json
{
    "status": "ok"
}
```
### Authentication
Generate a service token
```bash
POST /api/token
```
### Response:
```json
{
    "success": true,
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
}
```
### Books
Get Books
```bash
GET /api/books
Authorization: Bearer <token>
```
### Response:
```json
    {
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "Book Title",
      "author": "Author Name",
      "price": 29.99,
      "isbn": "1234567890123"
    }
  ]
}
```
### Bulk Create Books
```bash
POST /api/books/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "books": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "price": 29.99,
      "isbn": "1234567890123"
    }
  ]
}
```
### Response:
```json
{
    "success": true,
    "message": "Books created successfully",
    "data": [/* created books */]

}
```
## Vault Configuration
### Secret Paths
```bash
secret/integration-service/
├── credentials/
│   ├── service_email
│   └── service_password
├── services/
│   ├── auth_url
│   └── book_url
└── jwt/
    └── access_token_secret
```
### Secret Structure
```json
{
  "credentials": {
    "service_email": "integration.service@bookstore.internal",
    "service_password": "integration_service_password"
  },
  "services": {
    "auth_url": "http://localhost:5000/auth",
    "book_url": "http://localhost:8080/api"
  },
  "jwt": {
    "access_token_secret": "<shared_with_auth_service>"
  }
}
```
### API Documentation
Swagger documentation is available at:
```bash
http://localhost:8000/api-docs
```

## Security
### Authentication Flow
1. Service starts up and reads credentials from Vault
2. Service authenticates with Auth Service
3. Received token is used for subsequent requests
4. Token is verified using shared JWT secret
### Best Practices
- All secrets stored in Vault
- JWT tokens used for authentication
- CORS enabled for security
- Request validation middleware
- Error handling middleware

## Troubleshooting
### Common Issues

1. Vault Connection Failed
    - Check Vault status
    - Verify token permissions
    - Ensure correct Vault address
2.  Auth Service Connection Failed
    - Verify auth service is running
    - Check service credentials
    -  Confirm auth service URL
3. Book Service Connection Failed
    - Verify book service is running
    - Check service token
    - Confirm book service URL
