#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${YELLOW}➤ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

# Check if running in the correct directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the auth-service root directory"
    exit 1
fi

# Check for .env file
if [ ! -f .env ]; then
    print_status "No .env found. Running setup..."
    npm run setup
fi

# Check if Vault is running
if ! curl -s http://localhost:8201/v1/sys/health > /dev/null; then
    print_status "Vault is not running. Running setup..."
    npm run setup
fi

# Initialize system
print_status "Initializing system..."
node scripts/init-system.js

if [ $? -ne 0 ]; then
    print_error "System initialization failed"
    exit 1
fi

print_success "Setup complete"