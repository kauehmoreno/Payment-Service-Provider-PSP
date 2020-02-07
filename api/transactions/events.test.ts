import { ObjectId } from "mongodb"
import * as logger from 'bunyan';
import { createTransaction, withValue, withMethod, paymentMethod, withCard, withClientId, transactionCacheKey, transactionClientCacheKey } from "./transactions"
import { onCreate } from "./events"
import { newQueue } from "../queue/queue";
import { mockQueue } from "../queue/queue.test";

const mockStorager = {
    get: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
}

afterEach(()=>{
    mockStorager.set.mockReset()
    mockStorager.get.mockReset()
})

const log = logger.createLogger({
    name:"app-test",
    level:"info"
})

describe("transaction events",()=>{
    const clientId = new ObjectId().toHexString()
        const transaction = createTransaction("my fake one",withValue(99.9),
        withMethod(paymentMethod.debit), withCard("fake-card-id"),withClientId(clientId))
    describe("onCreate event",()=>{
        test("should execute set value on cache by transaction id",()=>{
            const queue = newQueue(new mockQueue())
            mockStorager.set.mockImplementation((key:string,cb:(error:Error|null,reply:any)=>void)=>{
                expect(key).toBe(`${transactionCacheKey}${transaction._id}`)
            })
            onCreate(mockStorager,log, queue, transaction)
            expect(mockStorager.set.call.length).toBe(1)
        })
        test("should try to delete two keys of this transactions to reset cache state",()=>{
            const queue = newQueue(new mockQueue())
            mockStorager.delete.mockImplementation((keys:string[])=>{
                expect(keys).toHaveLength(2)
                expect(keys[0]).toBe(`${transactionCacheKey}${transaction.createdAt.toJSON().split("T")[0]}`)
                expect(keys[1]).toBe(`${transactionClientCacheKey}${transaction.clientId}`)
            })
            onCreate(mockStorager,log, queue, transaction)
        })
        test("should call queue publish after invoked onCreate",()=>{
            const mocked = new mockQueue()
            const queue = newQueue(mocked)
            onCreate(mockStorager,log, queue, transaction)
            expect(mocked.publishCalls()).toBe(1)
        })
    })
})