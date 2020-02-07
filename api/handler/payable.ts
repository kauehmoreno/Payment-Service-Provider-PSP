import { ServerConf } from "../server/server";
import { Handler } from "express";
import * as express from "express";
import { writeResponse, withStatusCode, withError, withCache, withData } from "../core/response";
import { payableByTransactionId } from "../payable/repository";
import { transactionByClientId } from "../transactions/repository";
import { buildPaybleBalance } from "../payable/rules";

export const payableByTransactionIdHandler = (server:ServerConf): Handler => {
    return async(req:express.Request, resp:express.Response) =>{
        const id = req.params.id 
        if(!id){
            writeResponse(resp, withStatusCode(400),withError("invalid request params"))
            return
        }
        if(!server.database || !server.storage){
            server.log.error("database or storage are not defined")
            writeResponse(resp, withStatusCode(500),withError("something wrong happens"))
            return 
        }
        try{
            const payable = await payableByTransactionId(id, server.storage, server.database)
            writeResponse(resp, withStatusCode(200), withCache(120), withData(payable))
        }catch(error){
            server.log.error(`payable transactionId: ${id} [${error.name}]:${error.message}`)
            writeResponse(resp, withStatusCode(500),withError("something wrong happens"))
        }
    }
}


export const payableByClientIdHandler = (server:ServerConf): Handler => {
    return async(req:express.Request, resp: express.Response) => {
        const clientId = req.params.clientId
        if(!clientId){
            writeResponse(resp, withStatusCode(400),withError("invalid request params "))
            return
        }

        if(!server.database || !server.storage){
            server.log.error("database or storage are not defined")
            writeResponse(resp, withStatusCode(500),withError("something wrong happens"))
            return 
        }

        try{
            const transactions = await transactionByClientId(clientId,30, server.storage, server.database)
            const payableResults = await Promise.all(transactions.map(async tr => {
                if(server.storage && server.database) return await payableByTransactionId(tr._id, server.storage, server.database) 
                return null
            }))
            const balance = buildPaybleBalance(...payableResults)
            writeResponse(resp, withStatusCode(200),withCache(60),withData(balance))
        }catch(error){
            server.log.error(error)
            writeResponse(resp, withStatusCode(500),withError("something wrong happens"))
        }
    }
}