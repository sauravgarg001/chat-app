const jwt = require('jsonwebtoken')
const shortid = require('shortid')
const secretKey = 'IncubsenceChatApp';

let tokenLib = {
    generateToken: (data) => {
        return new Promise((resolve, reject) => {
            try {
                let claims = {
                    jwtid: shortid.generate(),
                    iat: Date.now(),
                    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
                    sub: 'authToken',
                    iss: 'incubChat',
                    data: data
                }
                let tokenDetails = {
                    token: jwt.sign(claims, secretKey),
                    tokenSecret: secretKey
                }
                resolve(tokenDetails)
            } catch (err) {
                reject(err)
            }
        });
    },
    verifyToken: (token, secretKey) => {
        return new Promise((resolve, reject) => {
            jwt.verify(token, secretKey, function(err, decoded) {
                if (err) {
                    reject(err)
                } else {
                    resolve(decoded);
                }
            });
        });
    }
}

module.exports = tokenLib;