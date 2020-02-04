import * as mockRedis from "redis-mock"
import {v4 as uuid} from "uuid"
import { newStorage } from "./cache"

interface testDoc {
    name:string
    status:string
}

describe("storager test case",()=>{
    const storager  = newStorage(mockRedis.createClient())
    describe("set cases",()=>{
        test("should return boolean true when insert value", async()=>{
            const doc = {
                name:"test cache document",
                status:"OK"
            }
            const ok = await storager.set<testDoc>("test insert", doc, JSON.stringify)
            expect(ok).toBeTruthy()
        })
        test("set a string instead of object should not throw error on invalidate operation",async()=>{
            const ok = await storager.set<string>("test:string","my test string",JSON.stringify)
            expect(ok).toBeTruthy()
        })
        test("should return false whenever something got wrong",async()=>{
            const ok = await storager.set<string>("test:string","my test string",(text: string, reviver?: ((this: any, key: string, value: any) => any) | undefined):any =>{
                throw new Error("my internal error")
            })
            expect(ok).toBeFalsy()
        })
    })
    describe("get case",()=>{
        test("should return an item whenever finds one",done=>{
            storager.get<testDoc>("test insert", (err:Error|null, reply:any) => {
                expect(err).toBeNull()
                const doc = JSON.parse(reply)
                expect(doc.name).toBe("test cache document")
                expect(doc.status).toBe("OK")
                done()
            })
        })
        test("should not return error on callback when does not find a item, instead reply is null", done=>{
            storager.get<testDoc>("not-found", (err:Error|null, reply:any) => {
                expect(err).toBeNull()
                expect(reply).toBeNull()
                done()
            })
        })
    })
    describe("delete case",()=>{
        test("should not throw error deleting a non-existing key and return false",async()=>{
            const ok = await storager.delete("non-existing-key")
            expect(ok).toBeFalsy()
        })
        test("should return true when delete a existing one", async()=>{
            const cacheKey = "existing-key"
            const isInsert = await storager.set<string>(cacheKey,"hello item",JSON.stringify)
            expect(isInsert).toBeTruthy()
            const ok = await storager.delete(cacheKey)
            expect(ok).toBeTruthy()
        })
    })
})