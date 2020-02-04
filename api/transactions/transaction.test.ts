import { createTransaction, withCard, withValue, withMethod, paymentMethod } from "./transactions"
import {v4 as uuid} from "uuid"

describe("transaction test case",()=>{
    const transaction = createTransaction(
        "Smartband XYZ 3.0", withCard(uuid()), 
        withValue(100.30),withMethod(paymentMethod.credit))
    test("should create transaction with current date",()=>{
        expect(transaction.createdAt.getDate()).toBe(new Date().getDate())
    })
    test("should create transaction with value given",()=>{
        expect(transaction.value).toBe(100.30)
    })
    test("should create transaction with payment method given",()=>{
        expect(transaction.method).toBe("credit_card")
    })
    test("should create transaction with given description",()=>{
        expect(transaction.description).toBe("Smartband XYZ 3.0")
    })
})