const Joi = require('@hapi/joi')

const authSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(2).required(),
    name: Joi.string().min(2).required(),
    role: Joi.string().required()

})
const loginSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(2).required()
})

module.exports = {
    authSchema,
    loginSchema
}
