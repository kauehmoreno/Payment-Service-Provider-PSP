import { Card } from "../card/card"
import { v4 as uuid} from "uuid"

export enum paymentMethod{
    debit = "debit_card",
    credit = "credit_card"
}

export interface Transaction{
    id: string
    value?: number
    description?:string
    method?:paymentMethod
    cardToken: string
}


type transactionBuilder = (transaction: Transaction) => void

export const withCard = (token: string): transactionBuilder => {
    return function(transaction: Transaction){
        transaction.cardToken = token
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
        id: uuid(),
        cardToken: ""
    }
    builders.forEach(builders => builders(tr));
    return tr
}