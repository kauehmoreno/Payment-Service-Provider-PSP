import { ObjectId } from "mongodb"
import { createTransaction, withClientId, withCard, withValue, withMethod, paymentMethod } from "../transactions/transactions"
import { newPayable } from "./payable"

describe("payable instance",()=>{
    test("should build payable based on debit transaction",()=>{
        const tr = createTransaction(
            "FAKE TRANSACTION", withClientId(new ObjectId().toHexString()),
            withCard(new ObjectId().toHexString()),withValue(1000),
            withMethod(paymentMethod.debit)
        )
        const payable = newPayable(tr)
        expect(payable.total).toBe(970)
        expect(payable.taxes).toBe(0.03)
        expect(payable.payableAt.toJSON().split("T")[0]).toBe(new Date().toJSON().split("T")[0])
    })
    test("should build payable based on credit transaction",()=>{
        const tr = createTransaction(
            "FAKE TRANSACTION", withClientId(new ObjectId().toHexString()),
            withCard(new ObjectId().toHexString()),withValue(1500),
            withMethod(paymentMethod.credit)
        )
        const payable = newPayable(tr)
        expect(payable.total).toBe(1425)
        expect(payable.taxes).toBe(0.05)
        const payableAt = new Date()
        payableAt.setDate(payableAt.getDate()+30)
        expect(payable.payableAt.toJSON().split("T")[0]).toBe(payableAt.toJSON().split("T")[0])
    })
})