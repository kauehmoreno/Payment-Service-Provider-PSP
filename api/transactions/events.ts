import { Storager } from "../cache/cache"
import * as logger from 'bunyan';
import { Transaction } from "./transactions";

export const transactionEvent = {
    onCreate: (): string => "transaction_created"
}

export const onCreate = (cache:Storager,log: logger,tr: Transaction): void => {
    const key = `cacheKey${tr.id}`
    cache.set<Transaction>(key, tr, JSON.stringify).catch(err=>{
        log.error(err, "could not set transaction on cache")
    })
}