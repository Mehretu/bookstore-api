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
  - Postman collection
  - API documentation

## Directory Structure

bash
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