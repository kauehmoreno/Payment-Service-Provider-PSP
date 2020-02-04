import { ServerConf } from "../server/server"
import helmet = require("helmet")
import * as express from "express";
import * as compression from "compression";

export const middlewareBuilder = (server: ServerConf): void => {
    server.app.use(express.json())
    server.app.use(compression({level:1}))
    securityMiddlewares(server)
}

const securityMiddlewares = (server: ServerConf): void => {
    server.app.disable("x-powered-by");
    server.app.use(helmet())
}