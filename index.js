const {Client, PrivateKey, AccountId, AccountCreateTransaction, AccountBalanceQuery, Hbar, TransferTransaction, TokenMintTransaction, TokenCreateTransaction, TokenAssociateTransaction} = require("@hashgraph/sdk");


module.exports.mint_token = async ({customer_account_id, customer_private_key, tinybars, net, token: {name, initial_supply, symbol}}, operator_account_id, operator_private_key) => {

    const fornet = net === 'main' ? 'forMainnet' : 'forTestnet'

    const operator_client = Client[fornet]();
    operator_client.setOperator(operator_account_id, operator_private_key);

    const customer_client = Client[fornet]();
    customer_client.setOperator(customer_account_id, customer_private_key)

    const customerPublicKey = customer_private_key.publicKey

    // Operator keys
    const operatorPrivateKey = await PrivateKey.fromString(operator_private_key);
    const operatorPublicKey = operatorPrivateKey.publicKey;


    ///--------------------temp
    const getNewBalance = await new AccountBalanceQuery()
        .setAccountId(operator_account_id)
        .execute(customer_client);

    console.log("Operator balance " + getNewBalance.hbars.toTinybars() + " tinybar.")

    const getNewBalance2 = await new AccountBalanceQuery()
        .setAccountId(customer_account_id)
        .execute(customer_client);

    console.log("Customer balance " + getNewBalance2.hbars.toTinybars() + " tinybar.")
    ///--------------------temp



    //Create the transfer transaction
    const transferTransactionResponse = await new TransferTransaction()
        .addHbarTransfer(customer_account_id, Hbar.fromTinybars(-tinybars))
        .addHbarTransfer(operator_account_id, Hbar.fromTinybars(tinybars))
        .execute(customer_client);

    //Verify the transaction reached consensus
    const transactionReceipt = await transferTransactionResponse.getReceipt(operator_client);
    console.log("The transfer transaction from my account to the new account was: " + transactionReceipt.status.toString());

    ///--------------------temp
    const getNewBalance3 = await new AccountBalanceQuery()
        .setAccountId(operator_account_id)
        .execute(customer_client);

    console.log("After transfer operator balance " + getNewBalance3.hbars.toTinybars() + " tinybar.")

    const getNewBalance4 = await new AccountBalanceQuery()
        .setAccountId(customer_account_id)
        .execute(customer_client);

    console.log("After transfer customer balance " + getNewBalance4.hbars.toTinybars() + " tinybar.")
    ///--------------------temp




    const transaction = await new TokenCreateTransaction()
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setTreasuryAccountId(operator_account_id)
        .setInitialSupply(initial_supply)
        .setAdminKey(operatorPublicKey)
        .freezeWith(operator_client)
    // .setMaxTransactionFee(new HBar(30))

    //Sign the transaction with the token adminKey and the token treasury account private key
    const signTx = await (await transaction.sign(operatorPrivateKey)).sign(operatorPrivateKey);


    //Sign the transaction with the client operator private key and submit to a Hedera network
    const txResponse = await signTx.execute(operator_client);

    //Get the receipt of the transaction
    const receipt = await txResponse.getReceipt(operator_client);

    //Get the token ID from the receipt
    const tokenId = receipt.tokenId;

    console.log("A token has been created id: " + tokenId);








    //Associate a token to an account and freeze the unsigned transaction for signing
    const transaction3 = await new TokenAssociateTransaction()
        .setAccountId(customer_account_id)
        .setTokenIds([tokenId])
        .freezeWith(customer_client);

    //Sign with the private key of the account that is being associated to a token 
    const signTx3 = await transaction3.sign(customer_private_key);

    //Submit the transaction to a Hedera network    
    const txResponse3 = await signTx3.execute(customer_client);

    //Request the receipt of the transaction
    const receipt3 = await txResponse3.getReceipt(customer_client);

    //Get the transaction consensus status
    const transactionStatus3 = receipt3.status;

    console.log("The transaction consensus status " + transactionStatus3.toString());








    const transfer_token_transaction = await new TransferTransaction()
        .addTokenTransfer(tokenId, operator_account_id, -1)
        .addTokenTransfer(tokenId, customer_account_id, 1)
        .freezeWith(customer_client)

    //Sign with the sender account private key
    const signTx2 = await transfer_token_transaction.sign(operatorPrivateKey);

    //Sign with the client operator private key and submit to a Hedera network
    const txResponse2 = await signTx2.execute(customer_client);

    //Request the receipt of the transaction
    const receipt2 = await txResponse2.getReceipt(customer_client);

    //Obtain the transaction consensus status
    const transactionStatus2 = receipt2.status;

    console.log("The transaction consensus status " + transactionStatus2.toString());


    return tokenId

}