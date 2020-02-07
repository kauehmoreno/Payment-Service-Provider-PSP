import { serverBuild } from "../server/server"

import { Settings } from "../settings/settings"
import * as express from "express"

import { transactionCreateHandler } from "./transaction"
import { ObjectId } from "mongodb"

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

const generateBody = (): any => {
    return {
        "description": "Smartband XYZ 3.0",
        "value":100,
        "paymentMethod":"credit_card",
        "clientId":"5e3cab9312a74989abca6e52",
        "card":{
            "number":"5390255998612466",
            "name":"KAUEH MORENO A R",
            "expireAt":"07/2025",
            "cvv":894
        }
    }
}

describe("transaction handler",()=>{
    describe("transactionCreateHandler",()=>{
        describe("error cases",()=>{
            test("should return 400 when body is null",()=>{
                const server = serverBuild(express(),new Settings())
                const handler = transactionCreateHandler(server)
                handler({
                    body:null,
                    params:{},
                } as express.Request, {
                    status:(code:number): mockResponse => {
                        expect(code).toBe(400)
                        return {
                            json: (body:any): any => {
                                expect(body.result.error).toBe("invalid body request")
                            }
                        }
                    }
                }as express.Response, ()=>{})
            })
            test("should return error if card is not provided",()=>{
                const body = {
                    "description": "Smartband XYZ 3.0",
                    "value":100,
                    "paymentMethod":"credit_card",
                    "clientId":"5e3cab9312a74989abca6e52",
                }
                const server = serverBuild(express(),new Settings())
                const handler = transactionCreateHandler(server)
                handler({
                    body:body,
                    params:{},
                } as express.Request, {
                    status:(code:number): mockResponse => {
                        expect(code).toBe(400)
                        return {
                            json: (body:any): any => {
                                expect(body.result.error).toBe("invalid body request")
                            }
                        }
                    }
                }as express.Response, ()=>{})
            })
            test("if database is not provided it should return 500",()=>{
                const server = serverBuild(express(),new Settings())
                const handler = transactionCreateHandler(server)
                handler({
                    body:generateBody(),
                    params:{},
                } as express.Request, {
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
            test("should return 400 if something on body does not pass on validation",()=>{
                const body = generateBody()
                body.card.number = "11111111111"
                const server = serverBuild(express(),new Settings())
                server.database = mockDb
                const handler = transactionCreateHandler(server)
                handler({
                    body:body,
                    params:{},
                } as express.Request, {
                    status:(code:number): mockResponse => {
                        expect(code).toBe(400)
                        return {
                            json: (body:any): any => {
                                expect(body.result.error).toBe("invalid body request to card")
                            }
                        }
                    }
                }as express.Response, ()=>{})
            })
            test("should return 500 if fails to save",()=>{
                const server = serverBuild(express(),new Settings())
                mockDb.insert.mockRejectedValue(new Error("mock error - fail to save"))
                server.database = mockDb
                const handler = transactionCreateHandler(server)
                handler({
                    body:generateBody(),
                    params:{},
                } as express.Request, {
                    status:(code:number): mockResponse => {
                        expect(code).toBe(500)
                        return {
                            json: (body:any): any => {
                                expect(body.result.error).toBe("something got wrong")
                            }
                        }
                    }
                }as express.Response, ()=>{})
            })
        })
        describe("success case",()=>{
            test("should return 200 when save transactions and card",()=>{
                const server = serverBuild(express(),new Settings())
                mockDb.insert.mockResolvedValue([new ObjectId().toHexString()])
                server.database = mockDb
                const handler = transactionCreateHandler(server)
                handler({
                    body:generateBody(),
                    params:{},
                } as express.Request, {
                    status:(code:number): mockResponse => {
                        expect(code).toBe(200)
                        return {
                            json: (body:any): any => {
                                expect(body.result.error).toBeUndefined()
                            }
                        }
                    }
                }as express.Response, ()=>{})
            })
        })
    })
})