import { ServerConf } from "../server/server";
import { Handler } from "express";
import * as express from "express";
import { writeResponse, withStatusCode, withError, withCache, withData } from "../core/response";
import { payableByTransactionId } from "../payable/repository";

export const payableByTransactionIdHandler = (server:ServerConf): Handler => {
    return async(req:express.Request, resp:express.Response) =>{
        const id = req.params.id 
        if(!id){
            writeResponse(resp, withStatusCode(400),withError("invalid body request"))
            return
        }
        if(!server.database || !server.storage){
            server.log.error("database or storage are not defined")
            writeResponse(resp, withStatusCode(500),withError("something wrong happens"))
            return 
        }
        try{
            const payable = payableByTransactionId(id, server.storage, server.database)
            writeResponse(resp, withStatusCode(200),withCache(120),withData(payable))
        }catch(error){
            server.log.error(`payable transactionId: ${id} [${error.name}]:${error.message}`)
            writeResponse(resp, withStatusCode(500),withError("something wrong happens"))
        }
    }
}