import * as express from 'express';
import *as env from 'dotenv';
import { serverBuild, serverWithQueue } from './api/server/server';
import { connDB, withUrl, withConnectionOpts, withDatabase } from './api/db/db';
import { routerBuilder } from './api/router/router';
import { connectStorage, withHost, withPort, withKeepAlive, withConnTimeout, withPassword } from './api/cache/cache';
import { Settings } from './api/settings/settings';
import { connectQueue, withQueueURL } from './api/queue/queue';
import { backoff } from './api/core/backoff';
import { registerEvent } from './api/server/events';


const application = express()

const envSetup = () => {
    const result = env.config()
    if(result.error){
        throw new Error(`could not load .env file: ${result.error.message}`)
    }
}

envSetup()


const settings = new Settings()
connectQueue(withQueueURL(settings.queue().url)).then(queue => {
    const serverConf = serverBuild(application, settings, serverWithQueue(queue))
    registerEvent(serverConf)
    // routers setup
    routerBuilder(serverConf)
    application.listen(8000, function(){
        const dbSettings = serverConf.settings.database()

        backoff(10, async()=> {
            connDB(withUrl(dbSettings.url), withConnectionOpts(dbSettings.options), withDatabase(dbSettings.databae)).then(db =>{
                serverConf.database = db
            }).catch(err => {
                serverConf.log.error(`fail to config db on app setup: [${err.name}]:${err.message}`)
                throw err
            })
        },20, (error:Error)=>{
            throw error
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
}).catch(err => {throw err})
