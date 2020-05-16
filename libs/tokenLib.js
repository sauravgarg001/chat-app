const jwt = require('jsonwebtoken')
const shortid = require('shortid')

//Config
const appConfig = require('../config/configApp');

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
                    token: jwt.sign(claims, appConfig.authToken.secretKey),
                    tokenSecret: appConfig.authToken.secretKey
                }
                resolve(tokenDetails);
            } catch (err) {
                reject(err);
            }
        });
    },
    verifyToken: (token, secretKey) => {
        return new Promise((resolve, reject) => {
            jwt.verify(token, secretKey, function(err, decoded) {
                if (err) {
                    reject(err);
                } else {
                    resolve(decoded);
                }
            });
        });
    },
    verifyTokenWithoutSecret: (token) => {
        return new Promise((resolve, reject) => {
            jwt.verify(token, appConfig.authToken.secretKey, function(err, decoded) {
                if (err) {
                    reject(err);
                } else {
                    resolve(decoded);
                }
            });
        });
    }
}

module.exports = tokenLib;