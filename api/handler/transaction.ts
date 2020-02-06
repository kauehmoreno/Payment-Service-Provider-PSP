import { ServerConf } from "../server/server";
import { Handler } from "express";
import * as express from "express";
import { createTransaction, withValue, withMethod } from "../transactions/transactions";
import { saveTransaction } from "../transactions/repository";
import { newCard, withCardNumber, withCardName, withExpireAt, withCardCvv } from "../card/card";
import { writeResponse, withError, withStatusCode, withData } from "../core/response";
import { saveCard } from "../card/repository";
import { validatorErrCode } from "../validator/validator";
import { ObjectId } from "mongodb";

export const transactionCreateHandler = (s:ServerConf): Handler => {
    return async(req:express.Request, resp:express.Response) => {
        const body = req.body
        if(!body.card){
            writeResponse(resp, withStatusCode(400),withError("invalid body request"))
            return
        }

        const transaction = createTransaction(body.description, withValue(body.value), withMethod(body.paymentMethod))
        const card = newCard(withCardNumber(body.card.number),withCardName(body.card.name), 
            withExpireAt(body.card.expireAt), withCardCvv(body.card.cvv))
        if(s.database){
            try{
                const cardId = await saveCard(card, s.database)
                transaction.cardId = cardId
                try{
                    const trId = await saveTransaction(transaction,s.database,s.event)
                    transaction._id = new ObjectId(trId)
                    writeResponse(resp, withStatusCode(200),withData({transactionId:trId, status:"created"}))
                    return
                }catch(error){
                    s.log.error(`transaction: [${error.name}]:${error.message}`)
                    if(error.code && error.code == validatorErrCode){
                        writeResponse(resp, withStatusCode(400),withError("invalid body request to transaction"))
                        return
                    }
                    writeResponse(resp, withStatusCode(500),withError("something got wrong"))
                }
            }catch(error){
                s.log.error(`card: [${error.name}]:${error.message}`)
                if(error.code && error.code == validatorErrCode){
                    writeResponse(resp, withStatusCode(400),withError("invalid body request to card"))
                    return
                }
                writeResponse(resp, withStatusCode(400),withError("invalid body request"))
            }
        }
    }
}