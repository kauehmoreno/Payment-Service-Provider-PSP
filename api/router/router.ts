import { ServerConf } from "../server/server";
import * as express from "express"
import { middlewareBuilder } from "./middleware";

export const routerBuilder = (server: ServerConf): void => {
    middlewareBuilder(server)
    healthCheckRouter(server)
}

const healthCheckRouter = (server: ServerConf): void => {
    server.app.get("/healthcheck", (request: express.Request, response: express.Response)=>{
        response.json({status:"WORKING"})
    })
}