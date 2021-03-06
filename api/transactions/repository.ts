import { Transaction, transactionCacheKey, transactionClientCacheKey } from "./transactions";
import { Storager } from "../cache/cache";
import { Writer, Reader } from "../db/db";
import { EventEmitter } from "events";
import { validate, valueValidator, paymentMethodValidator } from "./rules";
import { transactionEvent } from "./events";
import { Validators } from "../validator/validator";
import { ObjectId } from "mongodb";

enum tableName {
    name = "transaction"
}

export const saveTransaction = async (transaction: Transaction, db:Writer, notifer?:EventEmitter): Promise<string> => {
    const error = validate(transaction, valueValidator(), paymentMethodValidator())
    if(error){
        throw error
    }
    try{
        const result = await db.insert(tableName.name, [transaction])
        transaction._id = new ObjectId(result[0]).toHexString()
        notifer?.emit(transactionEvent.onCreate(), transaction)
        return transaction._id
    }catch(err){
        throw new Error(`could not save transaction [${err.name}]: ${err.message}`)
    }
}

export const transactionsByDate = async(date: string, limit:number, cache:Storager, db:Reader, ...validators: Validators<void>[]): Promise<Transaction[]> => {
    validators.forEach(validate => {
        const error = validate()
        if (error){
            throw error
        }
    });
    limit = limit > 30 ? 30 : limit 
    try{
        return await new Promise((resolve, reject)=>{
            cache.get<Transaction>(`${transactionCacheKey}${date}`, (error:Error|null, reply:any)=>{
                if(error){
                    reject(error)
                    return
                }
                reply ? resolve(JSON.parse(reply)) : reject(new Error("not found"))
            })
        })
    }catch(err){
        try{
            const transactions = await db.find<Transaction>(tableName.name, {createdAt:{$gte: new Date(Date.parse(date))}})
            try{
                await cache.set<Transaction[]>(`${transactionCacheKey}${date}`, transactions, JSON.stringify)    
                return transactions
            }catch(err){
                return transactions
            }
        }catch(err){
            throw new Error(`could not find transactions byDate:${date} [${err.name}]:${err.message}`)
        }
    }
}

export const transactionByClientId = async(clientId:string, limit:number, cache:Storager, db:Reader):Promise<Transaction[]> => {
    try{
        return await new Promise((resolve, reject)=>{
            cache.get<Transaction>(`${transactionClientCacheKey}${clientId}`, (error:Error|null, reply:any)=>{
                if(error){
                    reject(error)
                    return
                }
                reply ? resolve(JSON.parse(reply)) : reject(new Error("not found"))
            })
        })
    }catch(err){
        try{
            const transactions = await db.find<Transaction>(tableName.name, {clientId: clientId}, limit)
            try{
                await cache.set<Transaction[]>(`${transactionClientCacheKey}${clientId}`, transactions, JSON.stringify)    
                return transactions
            }catch(err){
                return transactions
            }
        }catch(err){
            throw new Error(`could not find transactions by client id:${clientId} [${err.name}]:${err.message}`)
        }
    }
}