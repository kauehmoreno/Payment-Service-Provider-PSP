import { Transaction } from "./transactions";
import { Storager } from "../cache/cache";
import { Writer } from "../db/db";
import { EventEmitter } from "events";
import { validate, valueValidator, paymentMethodValidator } from "./rules";
import { transactionEvent } from "./events";

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