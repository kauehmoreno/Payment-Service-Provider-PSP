import { ServerConf } from "./server";
import { transactionEvent, onCreate } from "../transactions/events";
import { Transaction } from "../transactions/transactions";
import { payableEvent,onCreate as oncreatePayable } from "../payable/event";
import { Payable } from "../payable/payable";

export const registerEvent = (server:ServerConf): void => {
    server.event.on(transactionEvent.onCreate(), (tr:Transaction)=>{
        server.storage ? onCreate(server.storage, server.log ,server.queue, tr): null
    })

    server.event.on(payableEvent.onCreate(),(payable:Payable)=>{
        server.storage ? oncreatePayable(server.storage,server.log, payable) : null
    })
}