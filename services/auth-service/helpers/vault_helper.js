const vault = require('node-vault')

class VaultHelper {
    constructor() {
        this.client = vault({
            apiVersion: 'v1',
            endpoint: process.env.VAULT_ADDR,
            token: process.env.VAULT_TOKEN
        })
        this.basePath = 'secret/data/auth-service'
    }

    async initialize() {
        try {
            await this.client.health()
            console.log('Vault connection established')
            return true
        } catch (error) {
            console.error('Failed to connect to Vault:', error)
            throw error
        }
    }

    async readSecret(path) {
        const { data } = await this.client.read(`${this.basePath}/${path}`)
        return data.data
    }
}

module.exports = new VaultHelper()