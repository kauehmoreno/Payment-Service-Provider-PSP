import { newCard, withCardNumber, withCardName, withExpireAt, withCardCvv,Card } from "./card"
import { saveCard, cardById } from "./repository"
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

describe("card repository",()=>{
    describe("save card",()=>{
        describe("error cases",()=>{
            test("should return error when a validation throws error",async()=>{
                const card = newCard(withCardNumber("32193093031231"))
                saveCard(card,mockDb).catch(err => {
                    expect(err.code).toBe(400)
                    expect(err.message).toBe("invalid card number:32193093031231")
                })
            })
            test("should trhow error if fails to insert on db",async()=>{
                const card = newCard(withCardNumber("5168441223630339"),withCardName("MY CARD NAME"),
                    withExpireAt("09/2027"),withCardCvv(233))

                mockDb.insert.mockRejectedValue(new Error("mock db error"))
                saveCard(card, mockDb).catch(err=>{
                    expect(err.message).toBe("could not save card 0339 [Error]: mock db error")
                })
            })
        })
        describe("success case",()=>{
            test("should call insert and return objectid representation to it",async()=>{
                const card = newCard(withCardNumber("5168441223630339"),withCardName("MY CARD NAME"),
                        withExpireAt("09/2027"),withCardCvv(233))
                const insertedId = new ObjectId()
                mockDb.insert.mockResolvedValue([insertedId.toHexString()])

                const result = await saveCard(card, mockDb)
                expect(result).toHaveLength(24)
                expect(result).toBe(insertedId.toHexString())
            })
            test("should modify credit card number on insert",async()=>{
                const card = newCard(withCardNumber("5168441223630339"),withCardName("MY CARD NAME"),
                        withExpireAt("09/2027"),withCardCvv(233))
                mockDb.insert.mockImplementation((table:string, obj:[Card]):Promise<string[]>=>{
                    expect(card.num).toHaveLength(4)
                    expect(card.num).toBe("0339")
                    return Promise.resolve([new ObjectId().toHexString()])
                })
                await saveCard(card, mockDb)
            })
        })
    })
    describe("card byId",()=>{
        describe("success cases",()=>{
            test("should return data from cache whenever hits one",async()=>{
                const card = newCard(withCardNumber("5168441223630339"),withCardName("MY CARD NAME"),
                        withExpireAt("09/2027"),withCardCvv(233))
                 mockStorager.get.mockImplementation((key:string,cb:(error:Error|null,reply:any)=>void)=>{
                     cb(null, JSON.stringify(card))
                 })

                const result = await cardById("3213123123",mockStorager,mockDb)
                expect(result?._id).toBe(card._id)
            })
            test("should retrieve item on db whenever cache does not find or fail and it cache back to set value",async()=>{
                const card = newCard(withCardNumber("5168441223630339"),withCardName("MY CARD NAME"),
                        withExpireAt("09/2027"),withCardCvv(233))
                 mockStorager.get.mockImplementation((key:string,cb:(error:Error|null,reply:any)=>void)=>{
                     cb(null, null)
                 })
                 const id = new ObjectId()
                 card._id = id
                 mockDb.get.mockResolvedValue(card)
                 const result = await cardById(id.toHexString(),mockStorager,mockDb)
                 expect(result?._id.toHexString()).toBe(id.toHexString())
                 expect(mockStorager.set.call.length).toBe(1)
            })
            test("should not return error if fails to set on cache",async()=>{
                const card = newCard(withCardNumber("5168441223630339"),withCardName("MY CARD NAME"),
                withExpireAt("09/2027"),withCardCvv(233))
                mockStorager.get.mockImplementation((key:string,cb:(error:Error|null,reply:any)=>void)=>{
                    cb(null, null)
                })
                const id = new ObjectId()
                card._id = id
                mockDb.get.mockResolvedValue(card)
                mockStorager.set.mockRejectedValue(new Error("fail to set value into cache"))
                const result = await cardById(id.toHexString(),mockStorager,mockDb)
                expect(result?._id.toHexString()).toBe(id.toHexString())
                expect(mockStorager.set.call.length).toBe(1) 
            })
        })
        describe("error case",()=>{
            test("should return error whenever db fails",async()=>{
                const card = newCard(withCardNumber("5168441223630339"),withCardName("MY CARD NAME"),
                withExpireAt("09/2027"),withCardCvv(233))
                mockStorager.get.mockImplementation((key:string,cb:(error:Error|null,reply:any)=>void)=>{
                    cb(null, null)
                })
                const id = new ObjectId()
                card._id = id
                mockDb.get.mockRejectedValue(new Error("fail to get item on db"))
                cardById(id.toHexString(),mockStorager,mockDb).catch(err=>{
                    expect(err.message).toBe(`could not get card:${id.toHexString()} [Error]:fail to get item on db`)
                })
                expect(mockDb.get.call.length).toBe(1)
                expect(mockStorager.get.call.length).toBe(1)
            })
        })
    })
})