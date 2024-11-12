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
    print_error "Vault is not running. Please ensure auth-service is set up first"
    exit 1
else
    print_status "Vault is running"
fi

# Get root token from auth-service vault log
AUTH_SERVICE_PATH="../auth-service/.vault-data/vault.log"
if [ -f "$AUTH_SERVICE_PATH" ]; then
    ROOT_TOKEN=$(grep "Root Token:" "$AUTH_SERVICE_PATH" | cut -d' ' -f3)
    print_status "Using token from auth-service"
else
    print_error "Could not find Vault token. Please ensure auth-service is set up first"
    exit 1
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
    echo "PORT=7000
VAULT_ADDR=http://127.0.0.1:8201
VAULT_TOKEN=$ROOT_TOKEN" > .env
else
    sed -i "s|VAULT_TOKEN=.*|VAULT_TOKEN=$ROOT_TOKEN|" .env
fi

# Get JWT secrets from auth-service
print_status "Getting JWT secrets from auth-service..."
JWT_SECRETS=$(vault kv get -format=json secret/auth-service/jwt)
if [ $? -ne 0 ]; then
    print_error "Failed to get JWT secrets from auth-service"
    exit 1
fi

ACCESS_TOKEN_SECRET=$(echo $JWT_SECRETS | jq -r '.data.data.access_token_secret')

# Setup initial secrets
print_status "Setting up secrets..."

# Setup service credentials
vault kv put secret/integration-service/credentials \
    service_email="integration.service@bookstore.new" \
    service_password="servicePassword123"

# Setup service URLs
vault kv put secret/integration-service/services \
    auth_url="http://localhost:5000/auth" \
    book_url="http://localhost:8080/api"

# Setup JWT configuration (using same secret as auth-service)
vault kv put secret/integration-service/jwt \
    access_token_secret="$ACCESS_TOKEN_SECRET"

print_success "Development environment setup complete!"
print_status "You can now start your application with: npm start"