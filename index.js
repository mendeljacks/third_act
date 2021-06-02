const {Client, PrivateKey, AccountId, AccountCreateTransaction, AccountBalanceQuery, Hbar, TransferTransaction, TokenMintTransaction, TokenCreateTransaction} = require("@hashgraph/sdk");


module.exports.mint_token = async ({customer_account_id, customer_private_key, tinybars, token: {name, initial_supply, symbol}}, operator_account_id, operator_private_key) => {

    const client = Client.forTestnet();
    client.setOperator(operator_account_id, operator_private_key);

///---------------Temporary--------------------------
    const temp_customer_private_key = await PrivateKey.generate()
  
    // Create a new account with 1,000 tinybar starting balance
    const newAccountTransactionResponse = await new AccountCreateTransaction()
        .setKey(temp_customer_private_key.publicKey)
        .setInitialBalance(Hbar.fromTinybars(1000))
        .execute(client);

    // Get the new account ID
    const getReceipt = await newAccountTransactionResponse.getReceipt(client);
    const temp_customer_account_id = getReceipt.accountId;

    console.log("The new account ID is: " + temp_customer_account_id);

    // Verify the account balance
    const accountBalance = await new AccountBalanceQuery()
        .setAccountId(temp_customer_account_id)
        .execute(client);

    console.log("The new account balance is: " + accountBalance.hbars.toTinybars() + " tinybar.");


///---------------Temporary--------------------------

    // Customer keys
    // const customerPrivateKey = await PrivateKey.fromString(customer_private_key)

    const customerPublicKey = temp_customer_private_key.publicKey //customerPrivateKey.publicKey;
    
    // Operator keys
    const operatorPrivateKey = await PrivateKey.fromString(operator_private_key);
    const operatorPublicKey = operatorPrivateKey.publicKey;


    // // If we weren't able to grab it, we should throw a new error
    // if (myAccountId == null ||
    //     myPrivateKey == null) {
    //     throw new Error("Environment variables myAccountId and myPrivateKey must be present");
    // }

    // Create our connection to the Hedera network
    // The Hedera JS SDK makes this really easy!

        ///--------------------temp
    // Check the new account's balance
    const getNewBalance = await new AccountBalanceQuery()
        .setAccountId(operator_account_id)
        .execute(client);

    console.log("The account balance after the transfer is: " + getNewBalance.hbars.toTinybars() + " tinybar.")

    // Check the new account's balance
    const getNewBalance2 = await new AccountBalanceQuery()
        .setAccountId(temp_customer_account_id)
        .execute(client);

    console.log("The account balance after the transfer is: " + getNewBalance2.hbars.toTinybars() + " tinybar.")
    ///--------------------temp



    //Create the transfer transaction
    const transferTransactionResponse = await new TransferTransaction()
        .addHbarTransfer(operator_account_id, Hbar.fromTinybars(-tinybars))
        .addHbarTransfer(temp_customer_account_id, Hbar.fromTinybars(tinybars))
        .execute(client);

    //Verify the transaction reached consensus
    const transactionReceipt = await transferTransactionResponse.getReceipt(client);
    console.log("The transfer transaction from my account to the new account was: " + transactionReceipt.status.toString());

    ///--------------------temp
    // Check the new account's balance
    const getNewBalance3 = await new AccountBalanceQuery()
        .setAccountId(operator_account_id)
        .execute(client);

    console.log("The account balance after the transfer is: " + getNewBalance3.hbars.toTinybars() + " tinybar.")

    // Check the new account's balance
    const getNewBalance4 = await new AccountBalanceQuery()
        .setAccountId(temp_customer_account_id)
        .execute(client);

    console.log("The account balance after the transfer is: " + getNewBalance4.hbars.toTinybars() + " tinybar.")
    ///--------------------temp




    const transaction = await new TokenCreateTransaction()
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setTreasuryAccountId(operator_account_id)
        .setInitialSupply(initial_supply)
        .setAdminKey(operatorPublicKey)
        .freezeWith(client)
    // .setMaxTransactionFee(new HBar(30))

    //Sign the transaction with the token adminKey and the token treasury account private key
    const signTx = await (await transaction.sign(operatorPrivateKey)).sign(operatorPrivateKey);
   

    //Sign the transaction with the client operator private key and submit to a Hedera network
    const txResponse = await signTx.execute(client);

    //Get the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the token ID from the receipt
    const tokenId = receipt.tokenId;

    console.log("The new token ID is " + tokenId);

    return tokenId

}