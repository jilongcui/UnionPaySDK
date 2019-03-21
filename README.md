# UnionPaySDK

A UnionPay SDK written by Node.JS

## To Install
`npm install unionpaysdk-node`

## To create order (This is an async function)
    const UnionPaySDK = require('unionpaysdk-node');

    const merId = '777290058110048';
    const certPath = '/certs/acp_test_sign.pfx';
    const password = '000000';
    const test_env = true;

    const unionPaySDK = new UnionPaySDK(merId, certPath, password, test_env);

    const orderId = 'testOrder2';
    const txnAmt = '100';
    const paymentUrl = await unionPaySDK.createOrder(orderId, txnAmt)

## To check order (This is an async function) 
    const UnionPaySDK = require('unionpaysdk-node');

    const merId = '777290058110048';
    const certPath = '/certs/acp_test_sign.pfx';
    const password = '000000';
    const test_env = true;

    const unionPaySDK = new UnionPaySDK(merId, certPath, password, test_env);

    const orderId = 'testOrder2';
    const txnTime = '20190315091142';
    const result = await unionPaySDK.checkOrder(orderId, txnTime);

### More functionalities coming soon...
