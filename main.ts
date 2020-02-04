import * as express from 'express';
import *as env from 'dotenv';
import { serverBuild } from './api/server/server';
import { Settings } from './settings/settings';
import { routerBuilder } from './api/router/router';
import { connDB, withUrl, withConnectionOpts, withDatabase } from './api/pkg/db/db';
import { connectStorage, withHost, withPort, withKeepAlive, withConnTimeout, withPassword } from './api/pkg/cache/cache';

const application = express()

const envSetup = () => {
    const result = env.config()
    if(result.error){
        throw new Error(`could not load .env file: ${result.error.message}`)
    }
}

envSetup()

const serverConf = serverBuild(application, new Settings())
// routers setup
routerBuilder(serverConf)

application.listen(8000, function(){
    const dbSettings = serverConf.settings.database()
    connDB(withUrl(dbSettings.url), withConnectionOpts(dbSettings.options), withDatabase(dbSettings.databae)).then(db =>{
        serverConf.database = db
    }).catch(err => {
        serverConf.log.error(`fail to config db on app setup: [${err.name}]:${err.message}`)
    })
    const storagerSettings = serverConf.settings.cache()
    
    try{
        const storage = connectStorage(
            withHost(storagerSettings.host), withPort(storagerSettings.port),
            withKeepAlive(storagerSettings.keepAlive),withConnTimeout(storagerSettings.timeout),
            withPassword(storagerSettings.password))
        serverConf.storage = storage
    }catch(err){
        serverConf.log.error(`fail to config cache on app setup: [${err.name}]:${err.message}`)
    }
})