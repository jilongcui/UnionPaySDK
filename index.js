const moment = require('moment-timezone');
const wopenssl = require('wopenssl');
const BigInt = require('big-integer');
const crypto = require('crypto');
const request = require('request-promise');

class UnionPaySDK {
    /**
     * 
     * @param {string} merId MerId provided by UnionPay
     * @param {string} certPath File path where Certificate file is stored(.pfx)
     * @param {string} password Password for Provided Certificate
     * @param {boolean} test_env Default to false
     */
    constructor(merId, certPath, password, test_env = false) {
        this.merId = merId;

        const result = UnionPaySDK.parseSignedDataFromPfx(certPath, password);
        const certificate = result['certificate'];

        this.privateKey = result['privateKey'];

        this.certId = UnionPaySDK.parseCertData(certificate);

        if (test_env) {
            this.create_order_url = 'https://gateway.test.95516.com/gateway/api/frontTransReq.do';
            this.check_order_url = 'https://gateway.test.95516.com/gateway/api/queryTrans.do'
        } else {
            this.create_order_url = 'https://gateway.95516.com/gateway/api/frontTransReq.do';
            this.check_order_url = 'https://gateway.95516.com/gateway/api/queryTrans.do'
        }

    }

    /**
     * 
     * @param {string} orderId Custom provided order id
     * @param {string} txnAmt The amount of the transaction in FEN
     * @param {string} backUrl The URL where UnionPay will send notification to
     * @param {string} frontUrl Merchandise return URL
     * @returns {string} Address of payment URL
     */
    async createOrder(orderId, txnAmt, backUrl = 'http://www.google.com', frontUrl = 'http://www.baidu.com') {

        const formData = {
            'bizType': '000201',
            'txnSubType': '01',
            'orderId': orderId,
            'backUrl': backUrl,

            'txnType': '01',
            'channelType': '07',
            'frontUrl': frontUrl,

            'encoding': 'UTF-8',
            'version': '5.1.0',
            'accessType': '0',
            'txnTime': `${moment().tz("Asia/Shanghai").format('YYYYMMDDHHmmss')}`,
            'merId': this.merId,
            'payTimeout': `${moment().tz("Asia/Shanghai").add(10, 'minutes').format('YYYYMMDDHHmmss')}`,
            'currencyCode': '156',
            'signMethod': '01',
            'txnAmt': txnAmt,
            'riskRateInfo': '{commodityName=测试商品名称}',

            'certId': this.certId
        };

        UnionPaySDK.signatureGenerate(formData, this.privateKey);

        var address = 'Fail to Fetch transaction Address! Please send an Email to me or create a issue at Github page';

        await request.post(this.create_order_url,
            { form: formData },
        ).catch((err) => {
            if (err['statusCode'] !== 302) {
                throw Error('Fail to Fetch transaction Address! Please send an Email to me or create a issue at Github page');
            }

            address = err.response.headers.location;
        });

        return address;
    }

    /**
     * 
     * @param {string} orderId OrderId of the transaction
     * @param {string} txnTime Transaction time when sending the transaction
     */
    async checkOrder(orderId, txnTime) {
        const formData = {
            'version': '5.1.0',
            'encoding': 'UTF-8',
            'signMethod': '01',
            'txnType': '00',
            'txnSubType': '00',
            'bizType': '000201',

            'merId': this.merId,
            'accessType': '0',

            'txnTime': txnTime,
            'orderId': orderId,

            'certId': this.certId,
        };

        UnionPaySDK.signatureGenerate(formData, this.privateKey);

        const response = await request.post(this.check_order_url, { form: formData });

        const { respCode, txnAmt } = UnionPaySDK.QueryStringToJSON(response);

        return { status: respCode === '00', amount: txnAmt };
    }

    static QueryStringToJSON(query) {
        var pairs = query.slice(1).split('&');

        var result = {};
        pairs.forEach(function (pair) {
            pair = pair.split('=');
            result[pair[0]] = decodeURIComponent(pair[1] || '');
        });

        return JSON.parse(JSON.stringify(result));
    }

    static hexToDecimal(hexStr) {
        return BigInt(hexStr, 16).toString();
    }

    static parseSignedDataFromPfx(path, password) {
        const extractedData = wopenssl.pkcs12.extract(path, password);
        return {
            certificate: extractedData.certificate,
            privateKey: extractedData.rsa,
        };
    }

    static parseCertData(certificate) {
        const certData = wopenssl.x509.parseCert(certificate);
        const certId = UnionPaySDK.hexToDecimal(certData.serial);
        return certId;
    }

    static createLinkString(params, encode, status) {
        let ks;
        let str = '';
        if (status === true) {
            ks = Object.keys(params).sort();
        } else {
            ks = Object.keys(params);
        }
        for (let i = 0; i < ks.length; i += 1) {
            let k = ks[i];
            if (encode === true) {
                k = encodeURIComponent(k);
            }
            if (str.length > 0) {
                str += '&';
            }
            if (k !== null && k !== undefined && k !== '') { // 如果参数的值为空不参与签名；
                str += `${k}=${params[k]}`;
                // str = str + k + '=' + params[k];
            }
        }
        return str;
    }

    static signatureGenerate(params, privateKey) {
        const newObj = params;
        if (Object.prototype.toString(params) === '[object Object]' && typeof privateKey === 'string') {
            const prestr = UnionPaySDK.createLinkString(params, true, true);

            const sha1 = crypto.createHash('sha256');
            sha1.update(prestr, 'utf8');
            const ss1 = sha1.digest('hex');
            // 私钥签名
            const sign = crypto.createSign('sha256');
            sign.update(ss1);
            const sig = sign.sign(privateKey, 'base64');
            newObj.signature = sig;
        } else {
            return false;
        }
        return newObj;
    }
}

module.exports = UnionPaySDK;