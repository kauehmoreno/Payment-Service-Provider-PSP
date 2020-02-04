import { newCard, withCardNumber, withCardName, withExpireAt, withCardCvv } from "./card"

describe("new card instance",()=>{
    test("should build empty card is none of builder are given",()=>{
        const card = newCard()
        expect(card).toMatchObject({})
    })
    test("should include number when name builder is given",()=> {
        const cardNumber:string = "5168441223630339"
        const card = newCard(withCardNumber(cardNumber))
        expect(card.num).toBe(cardNumber)
    })
    test("should include name when name builder is given",()=> {
        const cardName:string = "MY CARD NAME"
        const card = newCard(withCardName(cardName))
        expect(card.name).toBe(cardName)
    })
    test("should include expiration when name builder is given",()=> {
        const expireAt:string = "2020/12"
        const card = newCard(withExpireAt(expireAt))
        expect(card.expireAt).toBe(expireAt)
    })
    test("should include cvv when name builder is given",()=> {
        const cardCvv:number = 232
        const card = newCard(withCardCvv(cardCvv))
        expect(card.cvv).toBe(cardCvv)
    })
})