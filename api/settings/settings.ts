import e = require("express");

const databaseSettings = (): any => {
    const env = process.env;
    return {
        options:{
            poolSize: 10,
            tls: false,
            keepAlive:true,
            noDelay:true,
            useUnifiedTopology: true,
            useNewUrlParser:true,
            auth:{
                user: env.DB_LOGIN,
                password: env.DB_PASSWORD,
            },
        },
        appName:appSettings().appName,
        url: env.DB_URL,
        testUrl:"mongodb://localhost:27017",
        database:env.DB_DATABASE,
        port:27017,
    }
}

const appSettings = (): any => {
    const env = process.env;
    return {
        appName: env.APP_NAME??"psp",
        port: env.APP_PORT??8080,
        host: env.APP_HOST,
        logLevel: env.LOG_LEVEL??"info"
    }
}

const cacheSettings = (): any => {
    const env = process.env;
    return {
        host: env.CACHE_HOST??"",
        port: env.CACHE_PORT??"",
        keepAlive: env.CACHE_KEEPALIVE??true,
        timeout: env.CACHE_TIMEOUT,
        password: env.CACHE_PASSWORD,
    }
}

const queueSettings = (): any =>{
    const env = process.env;
    return {
        url: env.NATS_URL
    }
}

export class Settings {
    database():any {return databaseSettings()} 
    aplication(): any{return appSettings()}
    cache(): any {return cacheSettings()}
    queue():any {return queueSettings()}
};
