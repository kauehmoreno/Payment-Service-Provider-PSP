import *as env from 'dotenv';
import { Settings } from "../api/settings/settings"
import * as logger from 'bunyan';
import { connectQueue, withQueueURL } from '../api/queue/queue';
import { connDB, withUrl, withConnectionOpts, withDatabase } from '../api/db/db';
import { transactionEvent } from '../api/transactions/events';
import { Payable, newPayable } from '../api/payable/payable';
import { savePayable } from '../api/payable/repository';
import { backoff } from '../api/core/backoff';
import { Transaction } from '../api/transactions/transactions';

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

connectQueue(withQueueURL(settings.queue().url)).then(queue => {
    const dbSettings = settings.database()
    backoff(10, async ()=> {
        connDB(withUrl(dbSettings.url), withConnectionOpts(dbSettings.options), withDatabase(dbSettings.databae)).then(db =>{
            queue.subscribe(transactionEvent.onCreate(), (error:Error|null, msg:Transaction)=>{
                if(error){
                    log.error(`fail to subscribe [${error.name}]:${error.message}`)
                    process.abort() 
                }
                const payable = newPayable(msg)
                savePayable(payable, db).catch(err => {
                    backoff(10, async () => {
                        return await savePayable(payable, db)
                    }, 10) 
                })
            })
        }).catch(err => {
            log.error(`fail to config db on app setup: [${err.name}]:${err.message}`)
            throw err
        })
    },10)
}).catch(err => {
    log.error(`fail to connect with queue [${err.name}]:${err.message}`)
    throw err
})