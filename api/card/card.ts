import { ObjectID } from "mongodb"

export const cardCacheKey = "card:"
export interface Card{
    _id: ObjectID
    num: string
    name:string
    expireAt: string
    cvv: number
}


type CardBuilder = (c: Card) => void


export const withCardNumber = (num:string): CardBuilder => {
    return (c:Card) => c.num = num
}

export const withCardName = (name:string): CardBuilder => {
    return (c:Card) => c.name = name
}
export const withExpireAt = (date:string): CardBuilder => {
    return (c:Card) => c.expireAt = date
}
export const withCardCvv = (cvv:number): CardBuilder => {
    return (c:Card) => c.cvv = cvv
}

export const newCard = (...config:CardBuilder[]): Card => {
    let card: Card = {} as Card
    config.forEach(builder => {
        builder(card)
    });
    return card
}