const moment = require('moment-timezone');
const wopenssl = require('wopenssl');
const BigInt = require('big-integer');
const crypto = require('crypto');
const request = require('request-promise');

class UnionPaySDK {
    constructor(merId, orderId, backUrl, frontUrl, txnAmt) {
        this.formData = {
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
            'merId': merId,
            'payTimeout': `${moment().tz("Asia/Shanghai").add(10, 'minutes').format('YYYYMMDDHHmmss')}`,
            'currencyCode': '156',
            'signMethod': '01',
            'txnAmt': txnAmt,
            'riskRateInfo': '{commodityName=测试商品名称}'
        };
    }

    async createOrder(certPath, password) {
        const result = this.parseSignedDataFromPfx(certPath, password);
        const { privateKey } = result;
        const { certificate } = result;

        this.formData.certId = this.parseCertData(certificate);

        this.signatureGenerate(this.formData, privateKey);

        await request.post('https://gateway.test.95516.com/gateway/api/frontTransReq.do',
            { form: this.formData },
        ).catch((err) => {
            console.log()
        });
        console.log('after request');
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