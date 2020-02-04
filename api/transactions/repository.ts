import { Transaction, transactionCacheKey } from "./transactions";
import { Storager } from "../cache/cache";
import { Writer, Reader } from "../db/db";
import { EventEmitter } from "events";
import { validate, valueValidator, paymentMethodValidator } from "./rules";
import { transactionEvent } from "./events";
import { Validators } from "../validator/validator";

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
                }
                resolve(JSON.parse(reply))
            })
        })
    }catch(err){
        try{
            const transactions = await db.find<Transaction>(tableName.name, {createdAt:{$gte: new Date(Date.parse(date))}})
            cache.set<Transaction[]>(`${transactionCacheKey}${date}`, transactions, JSON.stringify).catch(err=>{
                return transactions
            })
            return transactions
        }catch(err){
            throw new Error(`could not find transactions byDate:${date} [${err.name}]:${err.message}`)
        }
    }
}