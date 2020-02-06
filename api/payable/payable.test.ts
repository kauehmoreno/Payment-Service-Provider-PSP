import { ObjectId } from "mongodb"
import { createTransaction, withClientId, withCard, withValue, withMethod, paymentMethod } from "../transactions/transactions"
import { newPayable } from "./payable"

describe("payable instance",()=>{
    test("should build payable based on debit transaction",()=>{
        const tr = createTransaction(
            "FAKE TRANSACTION", withClientId(new ObjectId().toHexString()),
            withCard(new ObjectId().toHexString()),withValue(132.32),
            withMethod(paymentMethod.debit)
        )
        const payable = newPayable(tr)
        expect(payable.total).toBe(129.32)
        expect(payable.taxes).toBe(0.03)
        expect(payable.payableAt.toJSON().split("T")[0]).toBe(new Date().toJSON().split("T")[0])
    })
    test("should build payable based on credit transaction",()=>{
        const tr = createTransaction(
            "FAKE TRANSACTION", withClientId(new ObjectId().toHexString()),
            withCard(new ObjectId().toHexString()),withValue(132.32),
            withMethod(paymentMethod.credit)
        )
        const payable = newPayable(tr)
        expect(payable.total).toBe(127.32)
        expect(payable.taxes).toBe(0.05)
        const payableAt = new Date()
        payableAt.setDate(payableAt.getDate()+30)
        expect(payable.payableAt.toJSON().split("T")[0]).toBe(payableAt.toJSON().split("T")[0])
    })
})