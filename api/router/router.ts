import { ServerConf } from "../server/server";
import { middlewareBuilder } from "./middleware";
import { healthcheckHandler } from "../handler/healthcheck";
import { transactionCreateHandler } from "../handler/transaction";

export const routerBuilder = (server: ServerConf): void => {
    middlewareBuilder(server)
    healthCheckRouter(server)
    publicRouter(server)
}

const healthCheckRouter = (server: ServerConf): void => {
    server.app.get("/healthcheck", healthcheckHandler(server))
}

const publicRouter = (server: ServerConf): void => {
    transactionRouter(server)
}

const transactionRouter = (server: ServerConf): void => {
    server.app.post("/transanction", transactionCreateHandler(server))
}