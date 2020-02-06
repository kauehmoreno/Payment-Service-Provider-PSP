import {onCreate} from "../payable/event"
import * as logger from 'bunyan';
import { newPayable, Payable } from "./payable";
import { createTransaction, withValue, withCard, withMethod, paymentMethod, withClientId } from "../transactions/transactions";
import { ObjectId } from "mongodb";

const mockStorager = {
    get: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
}

const log = logger.createLogger({
    name:"app-test",
    level:"info"
})

describe("on crete event on payable",()=>{
    describe("on payable created",()=>{
        const generatePayable = (): Payable => newPayable(
            createTransaction("FAKE TRANSACTION", withValue(120.20),
            withCard(new ObjectId().toHexString()),withMethod(paymentMethod.credit),
            withClientId(new ObjectId().toHexString())
        ))
        test("should set received value into cache",async()=>{
            const payable = generatePayable()
            mockStorager.set.mockResolvedValue(true)
            onCreate(mockStorager,log,payable)
            expect(mockStorager.set.call.length).toBe(1)
        })
        test("should not trhow error if set int cache fails",async()=>{
            const payable = generatePayable()
            mockStorager.set.mockRejectedValue(new Error("error to set into cache"))
            onCreate(mockStorager,log,payable)
            expect(mockStorager.set.call.length).toBe(1)
        })
    })
})