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
Environment variables are stored in the `.env` file. Here's a brief overview of each variable:
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