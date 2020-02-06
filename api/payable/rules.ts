import { Payable, Status } from "./payable"

import { paymentMethod } from "../transactions/transactions"

type Rules = (payable: Payable) => void

export const runRules = (payable:Payable, ...rules:Rules[]):void => {
    rules.forEach(rule => {
        rule(payable)
    });
}

export const statusModified = (method?: paymentMethod): Rules => {
    return (payable: Payable): void => {   
        method ? method == "debit_card" ? payable.status = Status.paid : payable.status = Status.waiting : null
    }
}

export const payableModified = (method?: paymentMethod): Rules => {
    return (payable: Payable): void => {
        method ? method == "debit_card" ? payable.payableAt = new Date() : payable.payableAt = payableDPlus30() : null
    }
}

export const taxesModified = (method?: paymentMethod): Rules => {
    return (payable: Payable): void => {
        method ? method == "debit_card" ? calculateTaxesAndDiscount(payable, 0.03) : calculateTaxesAndDiscount(payable, 0.05): null
    }
}

const calculateTaxesAndDiscount = (payable: Payable, taxes: number): void => {
    payable.taxes = taxes
    const totalWithDiscount = calaculateDiscount(payable.total, payable.taxes)
    payable.total = totalWithDiscount
}

const payableDPlus30 = (): Date => {
    let today = new Date()
    today.setDate(today.getDate()+30)
    return today 
}

const calaculateDiscount = (total: number, taxes: number): number => {
    return total - (100*taxes)
}