import { saveTransaction, transactionsByDate } from "./repository"
import { createTransaction, withValue, withMethod, paymentMethod, withCard, Transaction } from "./transactions"
import { v4 as uuid } from "uuid"
import { EventEmitter } from "events"
import { transactionEvent } from "./events"
import { dateValidator, limitValidator } from "./rules"
import { ObjectId } from "mongodb"

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

afterEach(()=>{
    mockDb.insert.mockReset()
    mockDb.find.mockReset()
    mockStorager.set.mockReset()
    mockStorager.get.mockReset()
})

describe("transaction repository",()=>{
    describe("save transaction test case",()=>{
        describe("error cases",()=>{
            test("should throw error whenever validation fails", async ()=>{
                const tr = createTransaction("my mock transaction", withValue(0), withMethod(paymentMethod.debit), withCard(uuid()))
                try{
                    await saveTransaction(tr, mockDb)
                }catch(err){
                    expect(err.code).toBe(400)
                    expect(err.message).toBe("invalid transaction value: R$ 0")
                }
            })
            test("should throw error whenever database fails to insert doc on db",async()=>{
                const tr = createTransaction("my mock transaction", withValue(10), withMethod(paymentMethod.debit), withCard(uuid()))
                mockDb.insert.mockRejectedValueOnce(new Error(`mock internal error`))
                try{
                    await saveTransaction(tr, mockDb)
                }catch(err){
                    expect(err.message).toBe("could not save transaction [Error]: mock internal error")
                }
            })
        })
        describe("success case",()=>{
            const tr = createTransaction("my mock transaction", withValue(10), withMethod(paymentMethod.debit), withCard(uuid()))
            test("should emit whenever client defines a notifier after a success operation",async()=>{
                const resolveId = new ObjectId()
                mockDb.insert.mockResolvedValueOnce([resolveId])
                const notifier = new EventEmitter()

                notifier.on(transactionEvent.onCreate(), (tr: Transaction)=>{
                    expect(tr._id).toBe(resolveId)
                    expect(tr.method).toBe(paymentMethod.debit)
                    expect(tr.description).toBe("my mock transaction")
                    expect(tr.value).toBe(10)
                })
                const result = await saveTransaction(tr, mockDb, notifier)
                expect(result.length).toBe(24)
                expect(result).toBe(resolveId.toHexString())
            })
            test("should not emit event if client does not specify an event and does not cause error",async ()=>{
                const resolveId = new ObjectId()
                mockDb.insert.mockResolvedValueOnce([resolveId])
                const result = await saveTransaction(tr, mockDb)
                expect(result.length).toBe(24)
                expect(result).toBe(resolveId.toHexString())
            })
        })
    })
    describe("transaction by date",()=>{
        describe("error cases",()=>{
            test("should throw error when validators fails",async()=>{
                try{
                    const result = await transactionsByDate("20-04-2020",10,mockStorager, mockDb, dateValidator("20-04-2020"))
                    expect(result).toBeUndefined()
                }catch(err){
                    expect(err.code).toBe(400)
                    expect(err.message).toBe("invalid date layout: 20-04-2020")
                }
            })
            test("should throw error when fails to retrieve transactions on db",async()=>{
                mockDb.find.mockImplementationOnce((table:string, query:Object)=>{
                    expect(query)
                    expect(query).toMatchObject({ createdAt: { "$gte": new Date("2020-01-20") } })
                    throw new Error("mock internal db error")
                })
                mockStorager.get.mockImplementationOnce((key:string, cb:(error:Error|null, reply:any)=>void)=>{
                    cb(new Error("error on cache"), null)
                })
                const date = "2020-01-20"
                try{
                    const result = await transactionsByDate(date,10,mockStorager, mockDb, dateValidator(date))
                    expect(result).toBeUndefined()
                }catch(err){
                    expect(err.message).toBe("could not find transactions byDate:2020-01-20 [Error]:mock internal db error")
                }
            })
        })
        describe("success cases",()=>{
            const date = "2020-01-20"
            test("should retrieve data from cache when finds",async()=>{
                mockStorager.get.mockImplementation((key:string, cb:(error:Error|null, reply:any)=>void)=>{
                    const data = [createTransaction("my fake one",withValue(99.9),withMethod(paymentMethod.debit), withCard("fake-card-id"))]
                    cb(null, JSON.stringify(data))
                })
                const result = await transactionsByDate(date, 10, mockStorager,mockDb, dateValidator(date),limitValidator(10))
                expect(result).toHaveLength(1)
                expect(result[0].cardId).toBe("fake-card-id")
                expect(result[0].value).toBe(99.9)
                expect(result[0].method).toBe("debit_card")
                expect(result[0].description).toBe("my fake one")
            })

            test("should return value from db when does not find on cache and set on cache right after",async ()=>{
                const data = [createTransaction("my fake one",withValue(99.9),withMethod(paymentMethod.debit), withCard("fake-card-id"))]
                mockStorager.get.mockImplementation((key:string, cb:(error:Error|null, reply:any)=>void)=>{
                    cb(null, null)
                })
                mockDb.find.mockResolvedValue(data)
                mockStorager.set.mockImplementation((key:string, v: any, marshaller: any)=> {
                    expect(key).toBe("transaction:2020-01-20")
                })
                const result = await transactionsByDate(date, 10, mockStorager,mockDb, dateValidator(date),limitValidator(10))
                expect(mockStorager.set.call.length).toBe(1)
                expect(result).toHaveLength(1)
                expect(result[0].cardId).toBe("fake-card-id")
                expect(result[0].value).toBe(99.9)
                expect(result[0].method).toBe("debit_card")
                expect(result[0].description).toBe("my fake one")
            })
            test("should return value from db and not throw error eventhgout set on cache fails",async ()=>{
                const data = [createTransaction("my fake one",withValue(99.9),withMethod(paymentMethod.debit), withCard("fake-card-id"))]
                mockStorager.get.mockImplementation((key:string, cb:(error:Error|null, reply:any)=>void)=>{
                    cb(null, null)
                })
                mockDb.find.mockResolvedValue(data)
                mockStorager.set.mockRejectedValue(new Error("set on cache has failed"))
                const result = await transactionsByDate(date, 10, mockStorager,mockDb, dateValidator(date),limitValidator(10))
                expect(mockStorager.set.call.length).toBe(1)
                expect(result).toHaveLength(1)
                expect(result[0].cardId).toBe("fake-card-id")
                expect(result[0].value).toBe(99.9)
                expect(result[0].method).toBe("debit_card")
                expect(result[0].description).toBe("my fake one")
            })
        })
    })
})