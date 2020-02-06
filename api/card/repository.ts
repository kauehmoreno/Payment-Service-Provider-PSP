import { EventEmitter } from "events";
import { Card, cardCacheKey } from "./card";
import { Writer, Reader } from "../db/db";
import { cardValidation, cardNumberValidator, cardNameValidator, cardExpirationValidator, cardCvvValidator, cardModifier, modifyCardNumber } from "./rules";
import { Storager } from "../cache/cache";
import { ObjectId } from "mongodb";


enum tableName {
    name = "card"
}

export const saveCard = async(card: Card, db:Writer, notifier?:EventEmitter): Promise<string> => {
    const error = cardValidation(card, cardNumberValidator(),
        cardNameValidator(),cardExpirationValidator(),
        cardCvvValidator())
    if (error){
        throw error
    }   
    try{
        cardModifier(card,modifyCardNumber())
        const result = await db.insert(tableName.name,[card])
        card._id = new ObjectId(result[0])
        return card._id.toHexString()
    }catch(err){
        throw new Error(`could not save card ${card.num} [${err.name}]: ${err.message}`)
    }
}

export const cardById = async (id:string, cache:Storager, db:Reader):Promise<Card | undefined> => {
    try{
        return await new Promise((resolve, reject)=>{
            cache.get<Card>(`${cardCacheKey}${id}`, (error:Error|null, reply:any)=>{
                if(error){
                    reject(error)
                    return
                }
                reply ? resolve(JSON.parse(reply)) : reject(new Error("not found"))
            })
        })
    }catch(error){
        try{
            const card = await db.get<Card>(tableName.name,{_id: new ObjectId(id)})
            if(!card){
               return undefined
            }
            try{
                await cache.set<Card>(`${cardCacheKey}${id}`, card, JSON.stringify)
                return card
            }catch(err){
                return card
            }
        }catch(error){
            throw new Error(`could not get card:${id} [${error.name}]:${error.message}`)
        }
    }
}