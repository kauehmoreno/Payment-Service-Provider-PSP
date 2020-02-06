import { ServerConf } from "./server";
import { transactionEvent, onCreate } from "../transactions/events";
import { Transaction } from "../transactions/transactions";

export const registerEvent = (server:ServerConf): void => {
    server.event.on(transactionEvent.onCreate(), (tr:Transaction)=>{
        server.storage ? onCreate(server.storage, server.log ,server.queue, tr): null
    })
}