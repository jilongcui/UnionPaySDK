const moment = require('moment-timezone');
const wopenssl = require('wopenssl');
const BigInt = require('big-integer');
const crypto = require('crypto');
const request = require('request-promise');

class UnionPaySDK {
    constructor(merId, certPath, password) {
        this.merId = merId;

        const result = this.parseSignedDataFromPfx(certPath, password);
        const certificate = result['certificate'];

        this.privateKey = result['privateKey'];

        this.certId = this.parseCertData(certificate);
    }

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

        this.signatureGenerate(formData, this.privateKey);

        var address = 'Fail to Fetch transaction Address! Please send an Email to me or create a issue at Github page';

        await request.post('https://gateway.test.95516.com/gateway/api/frontTransReq.do',
            { form: formData },
        ).catch((err) => {
            if (err['statusCode'] !== 302) {
                throw Error('Fail to Fetch transaction Address! Please send an Email to me or create a issue at Github page');
            }

            address = err.response.headers.location;
        });

        return address;
    }

    async checkOrder(certPath, password, ) {

    }

    hexToDecimal(hexStr) {
        return BigInt(hexStr, 16).toString();
    }

    parseSignedDataFromPfx(path, password) {
        const extractedData = wopenssl.pkcs12.extract(path, password);
        return {
            certificate: extractedData.certificate,
            privateKey: extractedData.rsa,
        };
    }

    parseCertData(certificate) {
        const certData = wopenssl.x509.parseCert(certificate);
        const certId = this.hexToDecimal(certData.serial);
        return certId;
    }

    createLinkString(params, encode, status) {
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

    signatureGenerate(params, privateKey) {
        const newObj = params;
        if (Object.prototype.toString(params) === '[object Object]' && typeof privateKey === 'string') {
            const prestr = this.createLinkString(params, true, true);

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