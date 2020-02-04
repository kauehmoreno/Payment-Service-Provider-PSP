import { Validators, ValidateError, validateCustomError } from "../validator/validator";
import { Card } from "./card";
import * as cardValidator from "card-validator"


export const cardNumberValidator = (): Validators<Card> => {
    return function(card: Card): ValidateError|null {
        const validator = cardValidator.number(card.num)
        if (validator.isPotentiallyValid || validator.isValid){
            return null
        }
        return validateCustomError(new Error(`invalid card number`))
    }
}
 

export const cardNameValidator = (): Validators<Card> => {
    return(card:Card): ValidateError | null => {
        if(!card.name)return validateCustomError(new Error(`invalid name`))
        return null
    }
}

export const cardExpirationValidator = (): Validators<Card> => {
    return(card:Card):ValidateError | null => {
        const validator = cardValidator.expirationDate(card.expireAt)
        if(validator.isValid || validator.isPotentiallyValid){
            return null
        }
        return validateCustomError(new Error(`invalid expiration date: ${card.expireAt}`))
    }
}

export const cardCvvValidator = (): Validators<Card> => {
    return(card:Card):ValidateError | null => {
        const validator = cardValidator.cvv(card.cvv.toString())
        if(validator.isValid || validator.isPotentiallyValid){
            return null
        }
        return validateCustomError(new Error(`invalid cvv: ${card.cvv}`))
    }
}