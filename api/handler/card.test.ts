import * as express from 'express';
import { serverBuild } from '../server/server';
import { Settings } from '../settings/settings';
import { cardByIdHandle } from './card';
import { ObjectId } from 'mongodb';
import { newCard, withCardName, withExpireAt, withCardCvv, withCardNumber } from '../card/card';

export interface mockResponse {
    json: (body?: any) => any
}

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
    mockDb.get.mockReset()
    mockStorager.set.mockReset()
    mockStorager.get.mockReset()
})

describe("card handler",()=>{
    describe("error cases",()=>{
        test("should return status 400 when params is not provided",()=>{
            const server = serverBuild(express(),new Settings())
            const handler = cardByIdHandle(server)
            handler({
                body:{},
                params:{},
            } as express.Request, {
                status:(code:number): mockResponse => {
                    expect(code).toBe(400)
                    return {
                        json: (body:any): any => {
                            expect(body.result.error).toBe("invalid request params")
                        }
                    }
                }
            }as express.Response, ()=>{})
        })
        test("should return status 500 when database or storage is not provided",()=>{
            const server = serverBuild(express(),new Settings())
            const handler = cardByIdHandle(server)
            handler({
                body:{},
                params:{id: new ObjectId().toHexString()},
            } as express.Request<any>, {
                status:(code:number): mockResponse => {
                    expect(code).toBe(500)
                    return {
                        json: (body:any): any => {
                            expect(body.result.error).toBe("something wrong happens")
                        }
                    }
                }
            }as express.Response, ()=>{})
        })
        test("should return 500 if fails to retrieve from database",()=>{
            const server = serverBuild(express(),new Settings())

            mockStorager.get.mockImplementation((key:string, cb:(error:Error|null,reply:any)=>void)=>{
                cb(null,null)
            })
            mockDb.get.mockRejectedValue(new Error("fail to retrieve from db"))

            server.database = mockDb
            server.storage = mockStorager
            const handler = cardByIdHandle(server)
            handler({
                body:{},
                params:{id: new ObjectId().toHexString()},
            } as express.Request<any>, {
                status:(code:number): mockResponse => {
                    expect(code).toBe(500)
                    return {
                        json: (body:any): any => {
                            expect(body.result.error).toBe("something wrong happens")
                        }
                    }
                }
            }as express.Response, ()=>{})
        })
    })
    describe("success case",()=> {
        test("should return 200 when finds items",done =>{
            const cardId = new ObjectId().toHexString()
            const server = serverBuild(express(),new Settings())
            const card = newCard(withCardNumber("5168441223630339"),withCardName("MY CARD NAME FROM HANDLER"),
                    withExpireAt("09/2027"),withCardCvv(233))

            mockStorager.get.mockImplementation((key:string, cb:(error:Error|null,reply:any)=>void)=>{
                cb(null, JSON.stringify(card))
            })

            server.database = mockDb
            server.storage = mockStorager
            const handler = cardByIdHandle(server)
            handler({
                body:{},
                params:{id: cardId},
            } as express.Request<any>, {
                status:(code:number): mockResponse => {
                    expect(code).toBe(200)
                    return {
                        json: (body:any): any => {
                            expect(body.result.error).toBeUndefined()
                            expect(body.result.data.name).toBe(card.name)
                            expect(body.result.data.expireAt).toBe(card.expireAt)
                            expect(body.result.data.cvv).toBe(card.cvv)
                            done()
                        }
                    }
                },
                setHeader:(key:string, data:any) => {
                    expect(key).toBe("max-age")
                    expect(data).toBe(120)
                }
            }as express.Response, ()=>{})
        })
    })
})