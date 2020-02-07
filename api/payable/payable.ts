import { ObjectId } from "mongodb";
import { Transaction } from "../transactions/transactions";
import { runRules, statusModified, payableModified, taxesModified } from "./rules";

export enum Status{
    paid = "paid",
    waiting = "waiting_funds"
}

export const payableCacheKey = "payable:"

export interface Payable{
    _id: string
    transactionId: string
    status:Status
    createdAt: Date
    total: number
    taxes: number
    payableAt: Date
}


export const newPayable = (transaction:Transaction): Payable => {
    const payable = {
        _id: new ObjectId().toHexString(),
        transactionId: transaction._id,
        status: Status.paid,
        createdAt: new Date(),
        total: transaction.value? transaction.value : 0,
        taxes: 0,
        payableAt: new Date()
    }

    runRules(payable, statusModified(transaction.method),
        payableModified(transaction.method),taxesModified(transaction.method))

    return payable
}

