import { statusModified, runRules, payableModified, taxesModified, buildPaybleBalance } from "./rules"
import { paymentMethod, createTransaction, withClientId, withValue, withCard, withMethod } from "../transactions/transactions"
import { ObjectId } from "mongodb"
import { newPayable, Payable, Status } from "./payable"

const generatePayable = (id: string, value: number) : Payable => {
    return {
        _id: new ObjectId().toHexString(),
        transactionId: new ObjectId(id).toHexString(),
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
    describe("generate balance",()=>{
        const generateWaitingFundsBalance = (v:number): Payable => {
            const payable = generatePayable(new ObjectId().toHexString(), v)
            payable.status = Status.waiting
            return payable
        }
        test("should build balance correctly base on payables",()=>{
            const payables:Payable[] = [
                generatePayable(new ObjectId().toHexString(), 100), 
                generatePayable(new ObjectId().toHexString(), 1200), 
                generateWaitingFundsBalance(1000),
                generateWaitingFundsBalance(100),
            ]

            const balance = buildPaybleBalance(...payables)
            expect(balance.available).toBe(1300)
            expect(balance.waitingFunds).toBe(1100)
        })
        test("should keep floating point and preserve calculation",()=>{
            const payables:Payable[] = [
                generatePayable(new ObjectId().toHexString(), 100.44), 
                generatePayable(new ObjectId().toHexString(), 120.32), 
                generateWaitingFundsBalance(1000.21),
                generateWaitingFundsBalance(99.99),
            ]

            const balance = buildPaybleBalance(...payables)
            expect(balance.available).toBe(220.76)
            expect(balance.waitingFunds).toBe(1100.2)
        })
        test("an nullable element should change result calculation",()=>{
            const payables:(Payable|null)[] = [
                generatePayable(new ObjectId().toHexString(), 100.44), 
                null,
                generatePayable(new ObjectId().toHexString(), 120.32), 
                null,
                generateWaitingFundsBalance(1000.21),
                null,
                generateWaitingFundsBalance(99.99),
                null,
            ]
            const balance = buildPaybleBalance(...payables,null,null)
            expect(balance.available).toBe(220.76)
            expect(balance.waitingFunds).toBe(1100.2)
        })
    })
})