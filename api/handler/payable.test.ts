import { serverBuild } from "../server/server"
import * as express from 'express';
import { Settings } from "../settings/settings"

import { payableByTransactionIdHandler } from "./payable"
import { ObjectId } from "mongodb";
import { newPayable } from "../payable/payable";
import { createTransaction, withCard, withClientId, withMethod, paymentMethod, withValue } from "../transactions/transactions";

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

const forceCleanUp = (): void => {
    mockDb.insert.mockReset()
    mockDb.find.mockReset()
    mockDb.get.mockReset()
    mockStorager.set.mockReset()
    mockStorager.get.mockReset()
}

afterEach(()=>{
    mockDb.insert.mockReset()
    mockDb.find.mockReset()
    mockDb.get.mockReset()
    mockStorager.set.mockReset()
    mockStorager.get.mockReset()
})

describe("payable handler test case",()=>{
    describe("payableByTransactionIdHandler",()=>{
        describe("error cases",()=>{
            test("should return 400 when parans is not provided",()=>{
                const server = serverBuild(express(),new Settings())
                const handler = payableByTransactionIdHandler(server)
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
                const handler = payableByTransactionIdHandler(server)
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
            test("should return error when endpoint fails to retrieve item",()=>{
                const server = serverBuild(express(),new Settings())

                mockStorager.get.mockImplementation((key:string, cb:(error:Error|null,reply:any)=>void)=>{
                    cb(null,null)
                })
                mockDb.get.mockRejectedValue(new Error("fail to retrieve from db"))
    
                server.database = mockDb
                server.storage = mockStorager
                const handler = payableByTransactionIdHandler(server)
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
        describe("success case",()=>{
            test("should return 200 when everything workes fine",done =>{
                forceCleanUp()
                const server = serverBuild(express(),new Settings())
                const payable = newPayable(createTransaction(
                    "MY TRANSACTION",withCard(new ObjectId().toHexString()),
                    withClientId(new ObjectId().toHexString()),withValue(1200),
                    withMethod(paymentMethod.credit)))
                
                mockStorager.get.mockImplementation((key:string, cb:(error:Error|null,reply:any)=>void)=>{
                    cb(null,null)
                })
                mockDb.get.mockResolvedValue(payable)
                server.database = mockDb
                server.storage = mockStorager
                const handler = payableByTransactionIdHandler(server)
                handler({
                    body:{},
                    params:{id: new ObjectId().toHexString()},
                } as express.Request<any>, {
                    status:(code:number): mockResponse => {
                        expect(code).toBe(200)
                        return {
                            json: (body:any): any => {
                                expect(body.result.error).toBeUndefined()
                                expect(body.result.data.total).toBe(1140)
                                expect(body.result.data.taxes).toBe(0.05)
                                expect(body.result.data.status).toBe("waiting_funds")
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
})