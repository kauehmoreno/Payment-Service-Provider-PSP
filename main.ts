import * as express from 'express';
import *as env from 'dotenv';
import { serverBuild } from './api/server/server';
import { Settings } from './settings/settings';
import { connDB, withUrl, withConnectionOpts, withDatabase } from './api/db/db';
import { routerBuilder } from './api/router/router';


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
        serverConf.log.error(`fail to config db on app setup: ${err.message}`)
    })
})