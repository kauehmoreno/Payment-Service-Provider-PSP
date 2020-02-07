import { ServerConf } from "../server/server";
import { Handler } from "express";
import * as express from "express";
import { writeResponse, withStatusCode, withError, withCache, withData } from "../core/response";
import { cardById } from "../card/repository";

    export const cardByIdHandle = (s:ServerConf): Handler => {
        return async(req:express.Request, resp:express.Response) =>{
            const id = req.params.id
            if(!id){
                writeResponse(resp, withStatusCode(400),withError("invalid request params"))
                return
            }
            if(!s.database || !s.storage){
                s.log.error("database or storage are not defined")
                writeResponse(resp, withStatusCode(500),withError("something wrong happens"))
                return 
            }
            try{
                const card = await cardById(id,s.storage,s.database)
                writeResponse(resp, withStatusCode(200),withCache(120),withData(card))
                return
            }catch(err){
                s.log.error(`card:${id} [${err.name}]:${err.message}`)
                writeResponse(resp, withStatusCode(500),withError("something wrong happens"))
                return
            }
        }
    }