const vault = require('node-vault')

class VaultHelper {
    constructor() {
        this.client = vault({
            apiVersion: 'v1',
            endpoint: process.env.VAULT_ADDR || 'http://localhost:8201',
            token: process.env.VAULT_TOKEN
        })
        this.basePath = 'secret/data/notification-service' // Updated path
    }

    async initialize() {
        try {
            await this.client.health()
            console.log('✅ Vault connection established')
            return true
        } catch (error) {
            console.error('❌ Failed to connect to Vault:', error)
            throw error
        }
    }

    async readSecret(path) {
        try {
            const response = await this.client.read(`${this.basePath}/${path}`)
            return response.data.data 
                } catch (error) {
            console.error(`Failed to read secret at ${path}:`, error)
            throw error
        }
    }
}

module.exports = new VaultHelper()