import { Handler } from "express"
import { ServerConf } from "../server/server"
import { writeResponse, withStatusCode, withData } from "../core/response"
import * as express from "express"

export const healthcheckHandler = (s: ServerConf): Handler => {
    return async (req: express.Request, resp: express.Response) => {
        writeResponse(resp, withStatusCode(200), withData({status:"WORKING"}))
    }
}