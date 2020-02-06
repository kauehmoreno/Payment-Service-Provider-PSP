import *as env from 'dotenv';
import { Settings } from "../api/settings/settings"
import * as logger from 'bunyan';
import { connectQueue, withQueueURL } from '../api/queue/queue';
import { connDB, withUrl, withConnectionOpts, withDatabase } from '../api/db/db';
import { serverBuild } from '../api/server/server';
import { application } from 'express';
import { routerBuilder } from '../api/router/router';
import { transactionEvent } from '../api/transactions/events';
import { Payable } from '../api/payable/payable';
import { savePayable } from '../api/payable/repository';

const envSetup = () => {
    const result = env.config()
    if(result.error){
        throw new Error(`could not load .env file: ${result.error.message}`)
    }
}

envSetup()

const settings = new Settings()
const log = logger.createLogger({
    name:settings.aplication().appName,
    level:settings.aplication().logLevel
})

const retry = (retries: number, fn: () => Promise<any>) => {
    fn().catch(err => retries > 1 ? retry(retries - 1, fn) : Promise.reject(err));
}

const pause = (duration:number) => new Promise(res => setTimeout(res, duration));

const backoff = (retries:number, fn: () => Promise<any>, delay = 500) =>{
    fn().catch(err => retries > 1
      ? pause(delay).then(() => backoff(retries - 1, fn, delay * 2))
      : Promise.reject(err));
}

connectQueue(withQueueURL(settings.queue().url)).then(queue => {
    const dbSettings = settings.database()
    connDB(withUrl(dbSettings.url), withConnectionOpts(dbSettings.options), withDatabase(dbSettings.databae)).then(db =>{
        queue.subscribe(transactionEvent.onCreate(), (error:Error|null, msg:Payable)=>{
            if(error){
                log.error(`fail to subscribe [${error.name}]:${error.message}`)
                process.abort() 
            }
            backoff(10, async () => {
                return await savePayable(msg, db)
            }, 10)
        })
    }).catch(err => {
        log.error(`fail to config db on app setup: [${err.name}]:${err.message}`)
        throw err
    })
}).catch(err => {
    log.error(`fail to connect with queue [${err.name}]:${err.message}`)
    throw err
})