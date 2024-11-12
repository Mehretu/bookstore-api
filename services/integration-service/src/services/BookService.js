const axios = require('axios')
const createError = require('http-errors')
const VaultHelper = require('../helpers/vault-helper')

class BookService {
    constructor(serviceToken) {
        this.token = serviceToken
    }

    async getBooks(query = {}) {
        try {
            const serviceUrls = await VaultHelper.readSecret('services')
            const response = await axios.get(`${serviceUrls.book_url}/books`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                params: query
            })
            return response.data
        } catch (error) {
            throw createError(error.response?.status || 500, 
                error.response?.data?.message || 'Book service error')
        }
    }

    async bulkCreateBooks(books) {
        try {
            const serviceUrls = await VaultHelper.readSecret('services')
            const response = await axios.post(
                `${serviceUrls.book_url}/books/bulk`,
                { books },
                {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                }
            )
            return response.data
        } catch (error) {
            throw createError(error.response?.status || 500, 
                error.response?.data?.message || 'Bulk create error')
        }
    }
}

module.exports = BookService