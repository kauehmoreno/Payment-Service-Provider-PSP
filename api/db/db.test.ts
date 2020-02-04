import { MongoClient } from "mongodb";
import *as env from 'dotenv';
import { Database, connDB, withUrl, withConnectionOpts, withDatabase } from "./db";

import { Settings } from "../../settings/settings";
import { MongoMemoryServer } from 'mongodb-memory-server';

jest.setTimeout(600000);

interface testDoc {
    name:string
    status:string
}

describe("test database module",()=>{
    let connection: MongoClient;
    let mongoServer:MongoMemoryServer;
    let database:Database;

    beforeAll(async()=>{
        env.config()
        const dbSettings = new Settings().database();
        mongoServer = new MongoMemoryServer();
        const mongoUri = await mongoServer.getConnectionString();
        const opts = {
            useNewUrlParser:true,
            useUnifiedTopology:true
        }
        const db = await connDB(withUrl(mongoUri), withConnectionOpts(opts),withDatabase(await mongoServer.getDbName()))
        database = db
    })
    afterAll(async()=>{
        if(connection) connection.close()
        if(mongoServer) await mongoServer.stop()
    })

    describe("insert case", ()=>{
        test("should return id when save doc on db", async ()=>{
            const result = await database.insert("test",[{name:"test",status:"ok"}])
            expect(result).toHaveLength(1)
        })
        test("should return multiples ids when multiples doc are inserted",async() =>{
            const docs = [{name:"test2",status:"ok"},{name:"test3",status:"ok"}]
            const ids = await database.insert("test",docs)
            expect(ids).toHaveLength(2)
        })

        test("should trhow error whenever fails to insert",async()=>{
            const docs = ["dont what to do"]
            try{
                const ids = await database.insert("test", docs)
            }catch(err){
                expect(err.message).toBe("Cannot create property '_id' on string 'dont what to do'")
            }
        })

    })
    describe("update case",()=>{
        test("should update doc properly and not return error", async()=>{
            const error = await database.update("test",{name:"test2"},{$set:{status:"blocked"}})
            expect(error).toBeNull()
            const results = await database.find<testDoc>("test",{status:"blocked"})
            expect(results).toHaveLength(1)
            expect(results[0].status).toBe("blocked")
            expect(results[0].name).toBe("test2")
        })
        test("should return error in case of wrong operation or intenal failure",async()=>{
            const error = await database.update("test",{name:"test2"},{$set:"lala"})
            expect(error?.name).toContain("MongoError")
        })
    })
    describe("get case",()=>{
        test("should return item whenever matchs one", async()=>{
            const result = await database.get<testDoc>("test",{name:"test"})
            expect(result?.name).toBe("test")
            expect(result?.status).toBe("ok")
        })
        test("return null when does not find an item",async()=>{
            const result = await database.get<testDoc>("test",{name:"not-existing-item"})
            expect(result).toBeNull()
        })
        test("should throw error whenever fails",async()=>{
            database.get<testDoc>("test","invalid-query").catch(err=>{
                expect(err.name).toBe("MongoError")
            })
        })
    })
    describe("find case",()=>{
        test("should return item whenever matchs one", async()=>{
            const result = await database.find<testDoc>("test",{name:"test"})
            expect(result).toHaveLength(1)
            expect(result[0].name).toBe("test")
            expect(result[0].status).toBe("ok")
        })
        test("return empty array when does not find an item",async()=>{
            const result = await database.find<testDoc>("test",{name:"not-existing-item"})
            expect(result).toHaveLength(0)
        })
        test("should throw error whenever fails",async()=>{
            database.find<testDoc>("test","invalid-query").catch(err=>{
                expect(err.name).toBe("MongoError")
            })
        })
    })
    describe("count case",()=>{
        test("should return number of find items",async()=>{
            const number = await database.count("test",5, {name:"test"})
            expect(number).toBe(1)
        })
        test("should return zero whenever does not find items",async()=>{
            const number = await database.count("test",10, {name:"not-existing-item"})
            expect(number).toBe(0)
        })
        test("should throw error when fails due to query error or internal one",async()=>{
            await database.count("test",5, { $match : { name : "test" } }).catch(err=>{
                expect(err.name).toBe("MongoError")
            })
        })
    })
    describe("delete case",()=>{
        test("should return null when operation is success",async()=>{
            const error = await database.delete("test",{name:"test"})
            expect(error).toBeNull()
        })
        test("return error when does not find element",async()=>{
            const error = await database.delete("test",{name:"non-existing-doc"})
            expect(error?.message).toBe("could not delete documents based on filter")
        })
        test("return error when query type is wrong",async()=>{
            const error = await database.delete("test","invalid query type")
            expect(error?.message).toBe("BSON field 'delete.deletes.q' is the wrong type 'string', expected type 'object'")
        })
    })

})  