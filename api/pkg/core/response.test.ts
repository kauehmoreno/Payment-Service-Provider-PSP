import { writeResponse, withCache, withData, withStatusCode, withError } from "./response"
import * as expressCore from "express"

export interface mockResponse {
    json: (body?: any) => any
}
describe("write response",()=>{
    describe("build msg without error",()=>{
        test("sucess response",()=>{
            writeResponse({
                status: (code:number): mockResponse =>{
                    return {
                        json: (body:any): any => {
                            expect(body.result.data.message).toBe("ok")
                        }
                    }
                }
            } as expressCore.Response, withData({message:"ok"}))
        })
        test("respect status code passed",()=>{
            writeResponse({
                status: (code:number): mockResponse =>{
                    expect(code).toBe(400)
                    return {
                        json: (body:any): any => {
                            expect(body.result.data.message).toBe("status")
                        }
                    }
                }
            } as expressCore.Response, withData({message:"status"}), withStatusCode(400))
        })
        test("should not contains error field",()=>{
            writeResponse({
                status: (code:number): mockResponse =>{
                    return {
                        json: (body:any): any => {
                            expect(body.result.error).toBeUndefined()
                        }
                    }
                }
            } as expressCore.Response, withData({message:"status"}), withStatusCode(400))
        })
    })
    describe("error msg",()=>{
        test("should contains error attr on body",()=>{
            writeResponse({
                status: (code:number): mockResponse =>{
                    return {
                        json: (body:any): any => {
                            expect(body.result.error).toBe("my mock error")
                            expect(body.result.data).toBeNull()
                        }
                    }
                }
            } as expressCore.Response, withError("my mock error"), withStatusCode(400))
        })
        test("should respect status code modified with error",()=>{
            writeResponse({
                status: (code:number): mockResponse =>{
                    expect(code).toBe(500)
                    return {
                        json: (body:any): any => {
                            expect(body.result.error).toBe("my mock error")
                            expect(body.result.data).toBeNull()
                        }
                    }
                }
            } as expressCore.Response, withError("my mock error"), withStatusCode(500))
        })
    })
})