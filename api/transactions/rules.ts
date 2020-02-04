import { Validators, ValidateError, validateCustomError } from "../validator/validator";
import { Transaction, paymentMethod } from "./transactions";



export const validate = (s:Transaction, ...vs: Validators<Transaction>[]): ValidateError | null => {
    for (const validator of vs) {
        const err = validator(s)
        if(err){
            return err
        }
    }
    return null
}

export const valueValidator = (): Validators<Transaction> => {
    return function(t: Transaction): ValidateError | null {
        if(t.value === undefined){
            return validateCustomError(new Error(`undefined transaction value`))
        }
        if (t.value <=0){
            return validateCustomError(new Error(`invalid transaction value: R$ ${t.value}`))
        }
        return null
    }
}

export const paymentMethodValidator = (): Validators<Transaction> => {
    return function(t: Transaction): ValidateError | null {
        if (!t.method){
            return validateCustomError(new Error(`not mapped payment method`))
        }
        if (!payment(t.method, isCreditCard(), isDebitCard())){
            return validateCustomError(new Error(`invalid payment method ${t.method}`))
        }
        return null
    }
}

type paymentType = (method: string) => boolean

export const payment = (method:string, ...payments: paymentType[]): boolean => {
    for (const payment of payments) {
        if (payment(method)) return true
    }
    return false
}

export const isCreditCard = (): paymentType => {
    return (method: string) => method == paymentMethod.credit
}

export const isDebitCard = (): paymentType => {
    return (method: string) => method == paymentMethod.debit
}