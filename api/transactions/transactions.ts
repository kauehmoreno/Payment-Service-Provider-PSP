import { Card } from "../card/card"
import { v4 as uuid} from "uuid"
import { ObjectId } from "mongodb"

export enum paymentMethod{
    debit = "debit_card",
    credit = "credit_card"
}

export const transactionCacheKey = "transaction:"

export interface Transaction{
    _id: ObjectId
    value?: number
    description?:string
    createdAt: Date
    method?:paymentMethod
    cardId: string
}


type transactionBuilder = (transaction: Transaction) => void

export const withCard = (cardId: string): transactionBuilder => {
    return function(transaction: Transaction){
        transaction.cardId = cardId
    }
}

export const withValue = (value: number): transactionBuilder => {
    return function(transaction: Transaction){
        transaction.value = value
    }
}

export const withMethod = (paymentMethod: paymentMethod): transactionBuilder => {
    return function(transaction: Transaction){
        transaction.method = paymentMethod
    }
}

export const createTransaction = (description: string, ...builders:transactionBuilder[]): Transaction => {
    const tr = {
        _id: new ObjectId(),
        createdAt: new Date(),
        cardId: "",
        description: description
    }
    builders.forEach(builders => builders(tr));
    return tr
}