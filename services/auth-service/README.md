# Auth Service Documentation

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Directory Structure](#directory-structure)
4. [Prerequisites](#prerequisites)
5. [Installation & Setup](#installation--setup)
6. [Configuration](#configuration)
7. [API Documentation](#api-documentation)
8. [Development Guide](#development-guide)
9. [Security](#security)
10. [Troubleshooting](#troubleshooting)
11. [Production Deployment](#production-deployment)

## Overview
The Auth Service is a crucial component of the Bookstore API, handling user authentication, authorization, and session management. It uses JWT for token-based authentication and HashiCorp Vault for secure secret management.

## Features
- 🔐 **Secure Authentication**
  - JWT-based authentication
  - Token refresh mechanism
  - Secure password hashing
  - Session management with Redis

- 👥 **Authorization**
  - Role-based access control (RBAC)
  - Permission-based access
  - Admin user management

- 🔒 **Security**
  - HashiCorp Vault integration
  - Secure secret management
  - Token blacklisting
  - Rate limiting

- 📚 **Documentation**
  - Swagger/OpenAPI documentation
  - REST Client(VS Code)
  - API documentation

## Directory Structure
```bash
services/auth-service/
├── .vault-data/ # Vault development data (auto-generated)
├── Controllers/
│ └── Auth.Controller.js # Authentication logic
├── Models/
│ └── User.model.js # User data model
├── Routes/
│ └── Auth.route.js # API routes
├── helpers/
│ ├── init_mongodb.js # MongoDB connection
│ ├── init_redis.js # Redis connection
│ ├── jwt_helper.js # JWT operations
│ ├── validation_schema.js # Request validation
│ └── vault_helper.js # Vault operations
├── scripts/
│ ├── dev-setup.sh # Development setup
│ ├── init-system.js # System initialization
│ └── init.sh # Startup script
├── .env.example # Environment variables template
├── .gitignore # Git ignore rules
├── app.js # Main application
├── package.json # Dependencies
└── swagger.js # API documentation
```
## Prerequisites
- Node.js (v16+)
- MongoDB (v4.4+)
- Redis (v6+)
- HashiCorp Vault (v1.12+)

## Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/mehretu/bookstore-api.git
cd services/auth-service
```
### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
**Copy environment template**
```bash
cp .env.example .env
```
**Edit environment variables**
```bash
nano .env
```

### 4. Development Setup
**Run development setup script**
```bash
npm run setup
```
> **Important Note about .vault-data**: 
> The `.vault-data` directory is created automatically by the setup script and contains Vault development data. It's gitignored for security reasons. When you run `npm run setup`, this directory will be created automatically. Do not manually create or modify this directory.

### 5. Start Service
```bash
npm start
```
## Configuration

### Environment Variables
**Server Configuration**
```bash
PORT=5000
```
**Vault Configuration**
```bash
VAULT_ADDR=http://127.0.0.1:8201
VAULT_TOKEN=<your-vault-token>
```
### Vault Secrets Structure
```bash
secret/
└── auth-service/
├── jwt/
│ ├── access_token_secret
│ └── refresh_token_secret
├── database/
│ ├── uri
│ └── db_name
└── admin/
├── email
├── password
└── name
```
## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json
{
"email": "user@example.com",
"password": "securePassword123!",
"name": "John Doe"
}
```
#### Login
```http
POST /auth/login
Content-Type: application/json
{
"email": "user@example.com",
"password": "securePassword123!"
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json
{
"refreshToken": "your_refresh_token_here"
}
```

#### Logout
```http
DELETE /auth/logout
Content-Type: application/json
{
"refreshToken": "your_refresh_token_here"
}
```
## Development Guide

### Running in Development Mode
***Start with nodemon***
```bash
npm run dev
```
### Common Development Tasks

#### 1. Adding New Secrets to Vault
***Access Vault CLI***
```bash
vault kv put secret/auth-service/new-secret \
key1="value1" \
key2="value2"
```
#### 2. Updating JWT Helper
```javascript
// helpers/jwt_helper.js
const newSecret = await vault_helper.readSecret('new-secret')
```

## Security

### Secret Management
- All secrets are managed through HashiCorp Vault
- Development secrets are automatically configured by setup script

### Token Management
- Access tokens expire after 30 minutes
- Refresh tokens are stored in Redis
- Blacklisted tokens are tracked in Redis

## Troubleshooting

### Common Issues

#### 1. Vault Connection Issues
***Check Vault status***
```bash
curl http://127.0.0.1:8201/v1/sys/health
```
***Reset development environment***
```bash
npm run setup
```

#### 2. MongoDB Connection Issues
***Verify MongoDB is running***
```bash
mongosh
```
***Check Vault secrets***
```bash
vault kv list secret/auth-service/database
```

#### 3. Redis Connection Issues
***Test Redis connection***
```bash
redis-cli ping
```
***Clear Redis data***
```bash
redis-cli FLUSHALL
```
## Production Deployment

### Docker Deployment
***Build Docker Image***
```bash
docker build -t auth-service .
```
***Run Docker Container***
```bash
docker run -p 5000:5000 \
-e VAULT_ADDR=http://127.0.0.1:8201 \
-e VAULT_TOKEN=<your-vault-token> \
auth-service
```

