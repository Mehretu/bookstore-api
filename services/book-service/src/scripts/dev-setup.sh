#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${YELLOW}➤ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

# Check if Vault is running
if ! curl -s http://localhost:8201/v1/sys/health > /dev/null; then
    print_status "Starting new Vault server..."
    mkdir -p .vault-data
    vault server -dev -dev-listen-address="127.0.0.1:8201" > .vault-data/vault.log 2>&1 &
    sleep 2
    
    ROOT_TOKEN=$(grep "Root Token:" .vault-data/vault.log | cut -d' ' -f3)
else
    print_status "Vault is already running"
    AUTH_SERVICE_PATH="../auth-service/.vault-data/vault.log"
    if [ -f "$AUTH_SERVICE_PATH" ]; then
        ROOT_TOKEN=$(grep "Root Token:" "$AUTH_SERVICE_PATH" | cut -d' ' -f3)
        print_status "Using token from auth-service"
    else
        print_error "Could not find Vault token. Please ensure auth-service is set up first"
        exit 1
    fi
fi

if [ -z "$ROOT_TOKEN" ]; then
    print_error "Could not find Vault root token"
    exit 1
fi

# Set Vault address and token
export VAULT_ADDR='http://127.0.0.1:8201'
export VAULT_TOKEN="$ROOT_TOKEN"

# Update .env file
if [ ! -f .env ]; then
    print_status "Creating .env file..."
    echo "PORT=8080
VAULT_ADDR=http://127.0.0.1:8201
VAULT_TOKEN=$ROOT_TOKEN" > .env
else
    sed -i "s|VAULT_TOKEN=.*|VAULT_TOKEN=$ROOT_TOKEN|" .env
fi

# Setup initial secrets
print_status "Setting up secrets..."

# Setup database configuration
vault kv put secret/book-service/database \
    mongodb_uri="mongodb://localhost:27017/bookstore-books"

# Setup service configuration
vault kv put secret/book-service/services \
    auth_service_url="http://localhost:5000" \
    rabbitmq_url="amqp://localhost:5672"

print_success "Development environment setup complete!"
print_status "You can now start your application with: npm start"