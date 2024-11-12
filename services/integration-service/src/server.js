require('dotenv').config()
const app = require('./app')
const VaultHelper = require('./helpers/vault-helper')
const startServer = async () => {
    try {
        // Initialize Vault
        await VaultHelper.initialize()

        const port = process.env.PORT || 7000
        app.listen(port, () => {
            console.log(`Integration service running on port ${port}`)
        })
    } catch (error) {
        console.error('Server startup error:', error)
        process.exit(1)
    }
}

startServer()