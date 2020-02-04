import { validate, valueValidator, paymentMethodValidator, payment, isCreditCard, isDebitCard } from "./rules"
import { withValue, createTransaction, withMethod, paymentMethod } from "./transactions"

describe("transaction rules",()=>{
    describe("transaction value",()=>{
        describe("error cases",()=>{
            test("should return error when value is equal zero",()=>{
                const error = validate(createTransaction("fake one", withValue(0)), valueValidator())
                expect(error?.code).toBe(400)
                expect(error?.message).toBe("invalid transaction value: R$ 0")
            })
            test("should return error when value is less than zero",()=>{
                const error = validate(createTransaction("fake one", withValue(-10)), valueValidator())
                expect(error?.code).toBe(400)
                expect(error?.message).toBe("invalid transaction value: R$ -10")
            })
            test("should return error when value is null or undefined",()=> {
                const error = validate(createTransaction("fake one"), valueValidator())
                expect(error?.code).toBe(400)
                expect(error?.message).toBe("undefined transaction value")
            })
        })
        describe("success case",()=>{
            test("should not return when value is greater than zero",()=>{
                const error = validate(createTransaction("fake one", withValue(10)), valueValidator())
                expect(error).toBeNull()
            })
        })
    })
    describe("transaction method",()=>{
        describe("error cases",()=>{
            test("should return if method is null or undefined",()=>{
                const error = validate(createTransaction("fake one", withValue(10)), paymentMethodValidator())
                expect(error?.code).toBe(400)
                expect(error?.message).toBe("not mapped payment method")
            })
            test("payment isCredit should return when is not",()=>{
                const ok = payment(paymentMethod.debit, isCreditCard())
                expect(ok).toBeFalsy()
            })
            test("payment isDebit should return when is not",()=>{
                const ok = payment(paymentMethod.credit, isDebitCard())
                expect(ok).toBeFalsy()
            })
        })
        describe("success case",()=>{
            test("should not return error when method is valid",()=>{
                const error = validate(
                    createTransaction("fake one", withValue(10),
                    withMethod(paymentMethod.credit)), paymentMethodValidator())
                expect(error).toBeNull()
            })
            test("payment isCredit should return true when matchs value",()=>{
                const ok = payment(paymentMethod.credit, isCreditCard())
                expect(ok).toBeTruthy()
            })
            test("payment isDebit should return true when matchs value",()=>{
                const ok = payment(paymentMethod.debit, isDebitCard())
                expect(ok).toBeTruthy()
            })
        })
    })
})