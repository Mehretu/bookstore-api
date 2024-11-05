const Joi = require('joi')

const bookSchema = Joi.object({
    title: Joi.string().required(),
    isbn: Joi.string().required(),
    author: Joi.string().required(),
    description: Joi.string().required(),
    category: Joi.string().valid('FICTION', 'NON-FICTION', 'BIOGRAPHY', 'SELF-HELP', 'TECHNOLOGY', 'HISTORY', 'MATH', 'SCIENCE', 'RELIGION', 'OTHER').required(),
    price: Joi.number().required(),
    metadata: Joi.object({
        genre: Joi.array().items(Joi.string()),
    })
})
const reviewSchema = Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().required(),
})

module.exports = {bookSchema, reviewSchema}