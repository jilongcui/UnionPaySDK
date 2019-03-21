# UnionPaySDK

A UnionPay SDK written by Node.JS

**IMPORTANT: Please Use node@8.9.0 !**

## To Install
    nvm install 8.9.0
    nvm use 8.9.0
    npm install node-unionpaysdk


## To create order (This is an async function)
    const UnionPaySDK = require('node-unionpaysdk');

    const merId = '777290058110048';
    const certPath = '/certs/acp_test_sign.pfx';
    const password = '000000';
    const test_env = true;

    const unionPaySDK = new UnionPaySDK(merId, certPath, password, test_env);

    const orderId = 'testOrder2';
    const txnAmt = '100';

    (async function () {
        /* Remember to copy the address from console to browser address bar */
        /* Example URL: https://cashier.test.95516.com/b2c/api/unifiedOrder.action?tn=809823759546359910101&sign=b571a2c42997f7f80c380640f9fc9f240e2f49faa142729d18fad4222c69d6a6 */
        console.log(await unionPaySDK.createOrder(orderId, txnAmt));
    })()

## To check order (This is an async function) 
    const UnionPaySDK = require('node-unionpaysdk');

    const merId = '777290058110048';
    const certPath = '/certs/acp_test_sign.pfx';
    const password = '000000';
    const test_env = true;

    const unionPaySDK = new UnionPaySDK(merId, certPath, password, test_env);

    const orderId = 'testOrder2';
    const txnTime = '20190315091142';

    (async function () {
        /* Example Response: { status: true, amount: 100 } */
        console.log(await unionPaySDK.checkOrder(orderId, txnTime));
    })()

### More functionalities coming soon...
