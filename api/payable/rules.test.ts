import { statusModified, runRules, payableModified, taxesModified } from "./rules"
import { paymentMethod, createTransaction, withClientId, withValue, withCard, withMethod } from "../transactions/transactions"
import { ObjectId } from "mongodb"
import { newPayable, Payable, Status } from "./payable"

const generatePayable = (id: string, value: number) : Payable => {
    return {
        _id: new ObjectId(),
        transactionId: new ObjectId(id),
        status: Status.paid,
        createdAt: new Date(),
        total: value,
        taxes: 0,
        payableAt: new Date()
    }
}

describe("payable rules",()=>{
    describe("Modifers on debit payment method",()=>{
        test("should include paid status when transaction payment method is debit",()=>{    
            const payable = generatePayable(new ObjectId().toHexString(), 100)
            const modify = statusModified(paymentMethod.debit)
            modify(payable)
            expect(payable.status).toBe("paid")
        })
        test("should include payable d+0 when transaction payment method is debit",()=>{
            const payable = generatePayable(new ObjectId().toHexString(), 100)
            const modify = payableModified(paymentMethod.debit)
            modify(payable)
            expect(payable.payableAt.toJSON().split("T")[0]).toBe(new Date().toJSON().split("T")[0])
        })
        test("should include change payable amount and include taxes of 3% on debit transaction",()=>{
            const payable = generatePayable(new ObjectId().toHexString(), 100)
            const modify = taxesModified(paymentMethod.debit)
            modify(payable)
            expect(payable.taxes).toBe(0.03)
            expect(payable.total).toBe(97)
        })
        test("should do nothing if payment method is undefined",()=>{
            const payable = generatePayable(new ObjectId().toHexString(), 0)
            const modify = taxesModified()
            modify(payable)
            expect(payable.taxes).toBe(0)
            expect(payable.total).toBe(0)
        })
    })

    describe("Modifers on credit payment method",()=>{
        test("should include waiting_funds status when transaction payment method is credit",()=>{
            const payable = generatePayable(new ObjectId().toHexString(), 100)
            const modify = statusModified(paymentMethod.credit)
            modify(payable)
            expect(payable.status).toBe("waiting_funds")
        })
        test("should include payable d+30 when transaction payment method is credit",()=>{
            const payable = generatePayable(new ObjectId().toHexString(), 100)

            const modify = payableModified(paymentMethod.credit)
            modify(payable)
            const payableAt = new Date()
            payableAt.setDate(payableAt.getDate()+30)
            expect(payable.payableAt.toJSON().split("T")[0]).toBe(payableAt.toJSON().split("T")[0])
        })
        test("should include change payable amount and include taxes of 5% on credit transaction",()=>{
            const payable = generatePayable(new ObjectId().toHexString(), 100)

            const modify = taxesModified(paymentMethod.credit)
            modify(payable)
            expect(payable.taxes).toBe(0.05)
            expect(payable.total).toBe(95)
        })
    })
})