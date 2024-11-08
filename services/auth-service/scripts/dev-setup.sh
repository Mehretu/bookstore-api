#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${YELLOW}➤ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

# Create data directory for Vault if it doesn't exist
mkdir -p .vault-data

# Check if Vault is already running
if lsof -i:8201 > /dev/null; then
    print_status "Vault is already running"
else
    # Start Vault in dev mode in background
    print_status "Starting Vault server..."
    vault server -dev -dev-listen-address="127.0.0.1:8201" > .vault-data/vault.log 2>&1 &
    sleep 2
fi

# Extract root token from vault.log
ROOT_TOKEN=$(grep "Root Token:" .vault-data/vault.log | cut -d' ' -f3)

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
    echo "PORT=5000
VAULT_ADDR=http://127.0.0.1:8201
VAULT_TOKEN=$ROOT_TOKEN" > .env
else
    # Update existing .env file
    sed -i "s|VAULT_TOKEN=.*|VAULT_TOKEN=$ROOT_TOKEN|" .env
fi

# Setup initial secrets if they don't exist
print_status "Setting up secrets..."

# Function to check if secret exists
secret_exists() {
    vault kv get secret/auth-service/$1 > /dev/null 2>&1
    return $?
}

# Setup JWT secrets if they don't exist
if ! secret_exists "jwt"; then
    print_status "Creating JWT secrets..."
    vault kv put secret/auth-service/jwt \
        access_token_secret=$(openssl rand -hex 32) \
        refresh_token_secret=$(openssl rand -hex 32)
fi

# Setup admin credentials if they don't exist
if ! secret_exists "admin"; then
    print_status "Creating admin credentials..."
    vault kv put secret/auth-service/admin \
        email="admin@admin.com" \
        password="AdminPassword123" \
        name="System Admin"
fi

# Setup database credentials if they don't exist
if ! secret_exists "database"; then
    print_status "Creating database credentials..."
    vault kv put secret/auth-service/database \
        uri="mongodb://localhost:27017" \
        db_name="auth"
fi

print_success "Development environment setup complete!"
print_status "You can now start your application with: npm start"