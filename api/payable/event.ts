import { Storager } from "../cache/cache"
import * as logger from 'bunyan';
import { Payable, payableCacheKey } from "./payable"

export const payableEvent = {
    onCreate: (): string => "payable_created"
}

export const onCreate = (cache:Storager,log: logger, payable: Payable): void => {
    const key = `${payableCacheKey}${payable._id.toHexString()}`
    cache.set<Payable>(key, payable, JSON.stringify).catch(err=>{
        log.error(err, "could not set payable on cache")
    })
}