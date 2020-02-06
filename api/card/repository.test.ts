import { newCard, withCardNumber, withCardName, withExpireAt, withCardCvv,Card } from "./card"
import { saveCard } from "./repository"
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
})