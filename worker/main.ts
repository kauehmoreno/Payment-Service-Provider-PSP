import *as env from 'dotenv';
import { Settings } from "../api/settings/settings"
import * as logger from 'bunyan';
import { connectQueue, withQueueURL, Queue } from '../api/queue/queue';
import { connDB, withUrl, withConnectionOpts, withDatabase, Database } from '../api/db/db';
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

interface ErrorMsg {
    topic:string
    data: Object
    error:Error
}

const buildErrorMsg = (data:Object, topic:string, err:Error): ErrorMsg => {
    return {
        topic:topic,
        data:data,
        error:err,
    }
}

const errorQueueTopic = "queue_topic_error"

const errorHandler = (queue: Queue): (error:Error|null, msg:ErrorMsg) => void =>{
    return (error:Error|null, msg:ErrorMsg):void=>{
        if(error){
            log.error(`[queue error]:${error.message}`)
            return
        }
        log.warn(`[queue]: puting data back to topic: ${msg.topic} due to error:${msg.error.message}`)
        queue.publish(errorQueueTopic,msg.data)
    }
} 

export const handleEvent = (db: Database,queue:Queue): (error:Error|null, msg:Transaction) => void =>{
    return (error:Error|null, msg:Transaction):void=>{
        if(error){
            log.error(`fail to subscribe [${error.name}]:${error.message}`)
            process.abort() 
        }
        const payable = newPayable(msg)
        savePayable(payable, db).catch(err => {
            log.warn("fail to save payable: starting backoff...")
            backoff(10, async ():Promise<string> => {
                return await savePayable(payable, db)
            }, 10,(error:Error)=>{
                log.warn(`backoff failure: ${error.message}`)
                queue.publish(errorQueueTopic, buildErrorMsg(msg, transactionEvent.onCreate(), error))
            })
        })
    }
}

connectQueue(withQueueURL(settings.queue().url)).then(queue => {
    const dbSettings = settings.database()
    backoff(10, async ()=> {
        connDB(withUrl(dbSettings.url), withConnectionOpts(dbSettings.options), withDatabase(dbSettings.databae)).then(db =>{
            queue.subscribe(errorQueueTopic, errorHandler(queue))
            queue.subscribe(transactionEvent.onCreate(), handleEvent(db,queue))
        }).catch(err => {
            log.error(`fail to config db on app setup: [${err.name}]:${err.message}`)
            throw err
        })
    },10,(error:Error)=>{
        throw error    
    })
}).catch(err => {
    log.error(`fail to connect with queue [${err.name}]:${err.message}`)
    throw err
})