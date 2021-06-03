require("dotenv").config();
const {mint_token} = require('./index')
const express = require('express')
const app = express()
const cors = require('cors')
const {serializeError} = require('serialize-error')
const joi = require('joi');
const {PrivateKey, Client, AccountCreateTransaction, AccountBalanceQuery, Hbar} = require("@hashgraph/sdk");
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
    net: joi.valid('test', 'main').required(),
    token: joi.object({
        name: joi.string().required(),
        symbol: joi.string().required(),
        initial_supply: joi.number().positive().integer().required()
    }).required()
})

app.post('/token', async (req, res) => {

    // Validate customer request
    const {error, value} = token_schema.validate(req.body);
    if (error) {
        return res.status(400).json(error)
    }

    // Extract variables from environment
    const operator_account_id = process.env.MY_ACCOUNT_ID
    const operator_private_key = process.env.MY_PRIVATE_KEY


    ///---------------Temporary make a test account on testnet--------------------------
    // const temp_customer_private_key = await PrivateKey.generate()
    // const client = Client['forTestnet']();
    // client.setOperator(operator_account_id, operator_private_key);
    // // Create a new account with 1,000 tinybar starting balance
    // const newAccountTransactionResponse = await new AccountCreateTransaction()
    //     .setKey(temp_customer_private_key.publicKey)
    //     .setInitialBalance(Hbar.fromTinybars(30*1000000000))
    //     .execute(client);

    // // Get the new account ID
    // const getReceipt = await newAccountTransactionResponse.getReceipt(client);
    // const temp_customer_account_id = getReceipt.accountId;

    // console.log("The new account ID is: " + temp_customer_account_id);

    // // Verify the account balance
    // const accountBalance = await new AccountBalanceQuery()
    //     .setAccountId(temp_customer_account_id)
    //     .execute(client);

    // console.log("The new account balance is: " + accountBalance.hbars.toTinybars() + " tinybar.");

    // req.body.customer_private_key = temp_customer_private_key
    // req.body.customer_account_id = temp_customer_account_id
    ///---------------Temporary--------------------------

    await mint_token(req.body, operator_account_id, operator_private_key)
        .then(result => res.status(200).json(result))
        .catch(err => {
            res.status(400).json(serializeError(err))
        })

})

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})