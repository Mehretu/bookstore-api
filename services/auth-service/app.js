require('./tracing')
const express = require('express')
const morgan = require('morgan')
const createError = require('http-errors')
const { error } = require('console')
require('dotenv').config()
require('./helpers/init_mongodb')
require('./helpers/init_redis')
const {verifyAccessToken} = require('./helpers/jwt_helper')
const AuthRoute = require('./Routes/Auth.route')
const swaggerUi = require('swagger-ui-express')
const swaggerSpecs = require('./swagger')



const app = express()

app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs))

app.get('/', verifyAccessToken, async(req, res,next) => {
    res.send("Hello from express.")
})

app.use('/auth', AuthRoute)

app.use(async(req, res, next) => {
    next(createError.NotFound())
})

app.use((err, req,res,next) => {
    res.status(err.status || 500)
    res.send({
        error:{
            status: err.status || 500,
            message: err.message,
        },
    })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () =>{
    console.log(`Server running on port ${PORT}`)
})
