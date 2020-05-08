let appConfig = {
    port: 3000,
    allowedCorsOrigin: "*",
    environment: "dev",
    db: {
        url: 'mongodb://127.0.0.1:27017/ChatAppDB'
    },
    apiVersion: '/api/v1'
}

module.exports = appConfig;