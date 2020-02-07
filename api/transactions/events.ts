import { Queue } from "../queue/queue"
import { Storager } from "../cache/cache"
import * as logger from 'bunyan';
import { Transaction, transactionCacheKey } from "./transactions";

export const transactionEvent = {
    onCreate: (): string => "transaction_created"
}

export const onCreate = (cache:Storager,log: logger, queue:Queue, tr: Transaction): void => {
    const key = `${transactionCacheKey}${tr._id.toHexString()}`
    cache.set<Transaction>(key, tr, JSON.stringify).catch(err=>{
        log.error(err, "could not set transaction on cache")
    })
    let dayTransaction = new Date().toJSON()
    dayTransaction = dayTransaction.split("T")[0]
    cache.delete([`${transactionCacheKey}${dayTransaction}`,`${transactionCacheKey}${tr.clientId}`]).catch(err=>{
        log.error(err, `could not delete transaction from: ${dayTransaction}`)
    })
    try{
        queue.publish(transactionEvent.onCreate(), tr)
    }catch(err){
        log.error(`could not queue ${tr._id}: [${err.name}]: ${err.message}`)
    }
}