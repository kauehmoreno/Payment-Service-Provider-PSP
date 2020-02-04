import { Transaction, transactionCacheKey } from "./transactions";
import { EventEmitter } from "events";
import { validate, valueValidator, paymentMethodValidator } from "./rules";
import { transactionEvent } from "./events";
import { Validators } from "../validator/validator";
import { Writer, Reader } from "../pkg/db/db";
import { Storager } from "../pkg/cache/cache";

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
        transaction.id = result[0]
        notifer?.emit(transactionEvent.onCreate(), transaction)
        return transaction.id
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
                cache.set<Transaction[]>(`${transactionCacheKey}${date}`, transactions, JSON.stringify)    
                return transactions
            }catch(err){
                return transactions
            }
        }catch(err){
            throw new Error(`could not find transactions byDate:${date} [${err.name}]:${err.message}`)
        }
    }
}