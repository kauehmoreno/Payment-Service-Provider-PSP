import { Queue } from "../queue/queue"
import { Storager } from "../cache/cache"
import * as logger from 'bunyan';
import { Transaction, transactionCacheKey, transactionClientCacheKey } from "./transactions";

export const transactionEvent = {
    onCreate: (): string => "transaction_created"
}

export const onCreate = (cache:Storager,log: logger, queue:Queue, tr: Transaction): void => {
    const key = `${transactionCacheKey}${tr._id}`

    tryAndLog(log, ()=> {
        cache.set<Transaction>(key, tr, JSON.stringify)
    })
    
    let dayTransaction = new Date().toJSON()
    dayTransaction = dayTransaction.split("T")[0]

    tryAndLog(log, ()=>{
        cache.delete([
            `${transactionCacheKey}${dayTransaction}`,
            `${transactionClientCacheKey}${tr.clientId}`
        ])
    })

    tryAndLog(log, ()=>{
        queue.publish(transactionEvent.onCreate(), tr)
    })
}


const tryAndLog = (log:logger, cb: ()=>void) => {
    try{
        cb()
    }catch(err){
        log.error(err.message)
    }
}