require("dotenv").config();
const {mint_token} = require('./index')
const express = require('express')
const app = express()
const cors = require('cors')
const {serializeError} = require('serialize-error')
const joi = require('joi');
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json({limit: '50mb'}))
app.use(express.urlencoded({extended: true, limit: '50mb'}))
app.use((err, req, res, next) => {
    // @ts-ignore
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        // @ts-ignore
        res.status(400).json({error: 'bad json', message: err.message, type: err.type})
    }
})

const token_schema = joi.object({
    customer_account_id: joi.any().required(),
    customer_private_key: joi.string().min(10).required(),
    tinybars: joi.number().positive().integer().required(),
    token: joi.object({
        name: joi.string().required(),
        symbol: joi.string().required(),
        initial_supply: joi.number().positive().integer().required()
    }).required()
})

app.post('/token', async (req, res) => {

    const {error, value} = token_schema.validate(req.body);
    if (error) {
        return res.status(400).json(error)
    }

    const operator_account_id = process.env.MY_ACCOUNT_ID
    const operator_private_key = process.env.MY_PRIVATE_KEY

    await mint_token(req.body, operator_account_id, operator_private_key)
        .then(result => res.status(200).json(result))
        .catch(err => {
            res.status(400).json(serializeError(err))
        })

})

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})