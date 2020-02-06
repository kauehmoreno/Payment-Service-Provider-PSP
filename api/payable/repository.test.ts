import { savePayable, payableByTransactionId } from "./repository"
import { newPayable, Payable } from "./payable"
import { createTransaction, withValue, withCard, paymentMethod, withMethod, withClientId } from "../transactions/transactions"
import { ObjectId } from "mongodb"
import { EventEmitter } from "events"
import { payableEvent } from "./event"

const mockDb = {
    insert:jest.fn().mockReturnThis(),
    update:jest.fn().mockReturnThis(),
    delete:jest.fn().mockReturnThis(),
    get:jest.fn().mockReturnThis(),
    find:jest.fn().mockReturnThis(),
    count:jest.fn().mockReturnThis()
}
const mockStorager = {
    get: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
}


describe("payable repository",()=>{
    const generatePayable = (): Payable => newPayable(
        createTransaction("FAKE TRANSACTION", withValue(120.20),
        withCard(new ObjectId().toHexString()),withMethod(paymentMethod.credit),
        withClientId(new ObjectId().toHexString())
    ))
    describe("savePayable",()=>{
        describe("error cases",()=>{
            test("should return error when fails to insert",()=>{
                const payable = generatePayable()
                mockDb.insert.mockRejectedValue(new Error("mock db error"))
                savePayable(payable,mockDb).catch(err=>{
                    expect(err.message).toContain("could not save payable")
                })
            })
        })
        describe("success cases",()=>{
            const payable = generatePayable()
            test("should save and emit event if a notifier is provided",async ()=>{
                const insertedId = new ObjectId().toHexString()
                mockDb.insert.mockResolvedValue([insertedId])
                const notfier = new EventEmitter()
                notfier.on(payableEvent.onCreate(), (payable: Payable)=>{
                    expect(payable._id.toHexString()).toBe(insertedId)
                    expect(payable.transactionId).toHaveLength(24)
                    expect(payable.taxes).toBe(0.05)
                    expect(payable.total).toBe(115.2)
                })
                await savePayable(payable,mockDb,notfier)
            })
            test("should save and not trhow error to emit event if a notifier is NOT provided",async ()=>{
                const insertedId = new ObjectId().toHexString()
                mockDb.insert.mockResolvedValue([insertedId])
                const result = await savePayable(payable,mockDb)
                expect(result).toHaveLength(24)
                expect(result).toBe(insertedId)
            })
        })
    })
    describe("payaleByTransactionId",()=>{
        describe("success cases",()=>{
            test("should return data from cache whenever hits one",async()=>{
                const payable = generatePayable()
                 mockStorager.get.mockImplementation((key:string,cb:(error:Error|null,reply:any)=>void)=>{
                     cb(null, JSON.stringify(payable))
                 })
                const result = await payableByTransactionId(payable._id.toHexString(),mockStorager,mockDb)
                expect(result?._id).toBe(payable._id.toHexString())
            })
            test("should retrieve item on db whenever cache does not find or fail and it cache back to set value",async()=>{
                const payable = generatePayable()
                 mockStorager.get.mockImplementation((key:string,cb:(error:Error|null,reply:any)=>void)=>{
                     cb(null, null)
                 })
                 const id = new ObjectId()
                 payable._id = id
                 mockDb.get.mockResolvedValue(payable)
                 const result = await payableByTransactionId(id.toHexString(),mockStorager,mockDb)
                 expect(result?._id.toHexString()).toBe(id.toHexString())
                 expect(mockStorager.set.call.length).toBe(1)
            })
            test("should not return error if fails to set on cache",async()=>{
                const payable = generatePayable()
                mockStorager.get.mockImplementation((key:string,cb:(error:Error|null,reply:any)=>void)=>{
                    cb(null, null)
                })
                const id = new ObjectId()
                payable._id = id
                mockDb.get.mockResolvedValue(payable)
                mockStorager.set.mockRejectedValue(new Error("fail to set value into cache"))
                const result = await payableByTransactionId(id.toHexString(),mockStorager,mockDb)
                expect(result?._id.toHexString()).toBe(id.toHexString())
                expect(mockStorager.set.call.length).toBe(1) 
            })
        })
    })
})