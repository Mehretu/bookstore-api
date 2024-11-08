require('dotenv').config()
const User = require('../Models/User.model')
const { ROLES } = require('../../../shared/auth')
const vault_helper = require('../helpers/vault_helper')
const { initMongoDB } = require('../helpers/init_mongodb')

async function initializeSystem() {
    try {
        await vault_helper.initialize()
        await initMongoDB()


        const superAdminExists = await User.findOne({ role: ROLES.ADMIN })
        if (superAdminExists) {
            console.log('Super admin already exists')
            process.exit(0)
        }

        const adminCreds = await vault_helper.readSecret('admin')

        const superAdmin = new User({
            email: adminCreds.email,
            password: adminCreds.password,
            name: adminCreds.name,
            role: ROLES.ADMIN
        })

        

        if (superAdmin.password.length < 12) {
            console.error('Super admin password must be at least 12 characters')
            process.exit(1)
        }

        await superAdmin.save()

        console.log('Super admin created successfully')
        console.log('Email:', adminCreds.email)
        console.log('\n⚠️  Please store these credentials securely!')
        
    } catch (error) {
        console.error('Failed to initialize system:', error)
        process.exit(1)
    } finally {
        process.exit(0)
    }
}

initializeSystem()