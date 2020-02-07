import { ServerConf } from "../server/server";
import { middlewareBuilder } from "./middleware";
import { healthcheckHandler } from "../handler/healthcheck";
import { transactionCreateHandler, transactionByDateHandler } from "../handler/transaction";
import { cardByIdHandle } from "../handler/card";
import { payableByTransactionIdHandler, payableByClientIdHandler } from "../handler/payable";

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
    cardRouter(server)
    payableRouter(server)
}

const transactionRouter = (server: ServerConf): void => {
    server.app.post("/transaction", transactionCreateHandler(server))
    server.app.get("/transaction/:date",transactionByDateHandler(server))
}

const cardRouter = (server:ServerConf): void => {
    server.app.get("/card/:id",cardByIdHandle(server))
}

const payableRouter = (server:ServerConf): void => {
    server.app.get("/payable/transaction/:id",payableByTransactionIdHandler(server))
    server.app.get("/payable/client/:clientId",payableByClientIdHandler(server))
}