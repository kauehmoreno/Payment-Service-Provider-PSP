import { Payable, payableCacheKey } from "./payable";
import { EventEmitter } from "events";
import { Writer, Reader } from "../db/db";
import { ObjectId } from "mongodb";
import { payableEvent } from "./event";
import { Storager } from "../cache/cache";

enum tableName {
    name = "payable"
}

export const savePayable = async(payable:Payable,db:Writer, notifer?:EventEmitter): Promise<string> =>{
    try{
        const result = await db.insert(tableName.name, [payable])
        payable._id = new ObjectId(result[0])
        notifer?.emit(payableEvent.onCreate(), payable)
        return payable._id.toHexString()
    }catch(err){
        throw new Error(`could not save payable:${payable._id.toHexString()} [${err.name}]: ${err.message}`)
    }
}

export const payableByTransactionId = async (trId: string, cache:Storager, db:Reader): Promise<Payable | null> => {
    try{
        return await new Promise((resolve, reject)=>{
            cache.get<Payable>(`${payableCacheKey}${trId}`, (error:Error|null, reply:any)=>{
                if(error){
                    reject(error)
                    return
                }
                reply ? resolve(JSON.parse(reply)) : reject(new Error("not found"))
            })
        })
    }catch(error){
        try{
            const payable = await db.get<Payable>(tableName.name,{transactionId: new ObjectId(trId)})
            if(!payable){
               return null
            }
            try{
                await cache.set<Payable>(`${payableCacheKey}${trId}`, payable, JSON.stringify)
                return payable
            }catch(err){
                return payable
            }
        }catch(error){
            throw new Error(`could not get payable by transaction id:${trId} [${error.name}]:${error.message}`)
        }
    }
}

