import { cardNumberValidator, cardNameValidator, cardExpirationValidator, cardCvvValidator } from "./rules"
import { newCard, withCardNumber, withCardName, withExpireAt, withCardCvv } from "./card"

describe("card rules",()=> {
    describe("card number validator",()=>{
        const validate = cardNumberValidator()
        describe("error cases",()=> {
            test("should return error when credit card is invalid",()=>{
                const card = newCard(withCardNumber("32193093031231"),withCardName("MY CARD NAME"),
                    withExpireAt("2017/09"),withCardCvv(233))
                const error = validate(card)
                expect(error?.code).toBe(400)
                expect(error?.message).toBe("invalid card number")
            })
        })
        describe("success cases",()=>{
            test("should not return error to masterCard card",()=>{
                const card = newCard(withCardNumber("5168441223630339"),withCardName("MY CARD NAME"),
                    withExpireAt("2017/09"),withCardCvv(233))
                expect(validate(card)).toBeNull()
            })
            test("should not return error to Visa card",()=>{
                const card = newCard(withCardNumber("4035300539804083"),withCardName("MY CARD NAME"),
                    withExpireAt("2017/09"),withCardCvv(233))
                expect(validate(card)).toBeNull()
            })
            test("should not return error to American Express card",()=>{
                const card = newCard(withCardNumber("371642190784801"),withCardName("MY CARD NAME"),
                    withExpireAt("2017/09"),withCardCvv(233))
                expect(validate(card)).toBeNull()
            })
        })
    })
    describe("card name validator",()=> {
        const validator = cardNameValidator()
        describe("error cases",()=>{
            test("should return error on empty cases",()=>{
                const card = newCard(withCardNumber("371642190784801"),
                    withExpireAt("2017/09"),withCardCvv(233))
                expect(validator(card)?.code).toBe(400)
                expect(validator(card)?.message).toBe("invalid name")
            })
        })
        describe("success case",()=>{
            const validator = cardNameValidator()
            test("should not return error when name is not empty",()=>{
                const card = newCard(withCardNumber("371642190784801"),withCardName("MY CARD NAME"),
                        withExpireAt("2017/09"),withCardCvv(233))
                expect(validator(card)).toBeNull()
            })
        })
    })
    describe("card expiration validator",()=>{
        const validate = cardExpirationValidator()
        describe("error cases",()=>{
            test("should return error when expiration has DD/MM/YYYY layout",()=>{
                const error = validate(newCard(withExpireAt("19/20/2027")))
                expect(error?.code).toBe(400)
                expect(error?.message).toBe("invalid expiration date: 19/20/2027")
            })
            test("should return error when expiration has YYYY-MM-DD layout",()=>{
                const error = validate(newCard(withExpireAt("2028-10-11")))
                expect(error?.code).toBe(400)
                expect(error?.message).toBe("invalid expiration date: 2028-10-11")
            })
            test("should return error when expiration is invalid",()=>{
                const error = validate(newCard(withExpireAt("invalid expiration")))
                expect(error?.code).toBe(400)
                expect(error?.message).toBe("invalid expiration date: invalid expiration")
            })
            test("should return error to expiration date layout as YYYY/MM",()=>{
                const error = validate(newCard(withExpireAt("2029/10")))
                expect(error?.code).toBe(400)
                expect(error?.message).toBe("invalid expiration date: 2029/10")
            })
        })
        describe("success case",()=> {
            test("should not return error to expiration date layout as MM/YY",()=>{
                const error = validate(newCard(withExpireAt("10/27")))
                expect(error).toBeNull()
            })
            test("should not return error to expiration date layout as MM/YYYY",()=>{
                const error = validate(newCard(withExpireAt("10/2027")))
                expect(error).toBeNull()
            })
            test("should not return error to expiration date layout as YYYY-MM",()=>{
                const error = validate(newCard(withExpireAt("2027-10")))
                expect(error).toBeNull()
            })
            test("should not return error to expiration date layout as MM YYYY",()=>{
                const error = validate(newCard(withExpireAt("10 2027")))
                expect(error).toBeNull()
            })
        })
    })
    describe("card cvv validator",()=>{
        const validate = cardCvvValidator()
        describe("error cases",()=>{
            test("should return error to cvv greater than 3",()=> {
                const error = validate(newCard(withCardCvv(3234)))
                expect(error?.code).toBe(400)
                expect(error?.message).toBe("invalid cvv: 3234")
            })
            test("should return error to negative cvv",()=> {
                const error = validate(newCard(withCardCvv(-32)))
                expect(error?.code).toBe(400)
                expect(error?.message).toBe("invalid cvv: -32")
            })
        })
        describe("success cases",()=>{
            test("should return null to cvv with length of 3",()=> {
                const error = validate(newCard(withCardCvv(123)))
                expect(error).toBeNull()
            })
        })
    })
})
