import *as env from 'dotenv';
import { Settings } from './settings';

describe("database settings", ()=> {
    env.config()
    const s = new Settings();
    describe("options internal config", () => {
        test("all expected setup", ()=>{
            expect(s.database().options.poolSize).toBe(10)
            expect(s.database().options.tls).toBeFalsy()
            expect(s.database().options.keepAlive).toBeTruthy()
            expect(s.database().options.noDelay).toBeTruthy()
            expect(s.database().options.useUnifiedTopology).toBeTruthy()
            expect(s.database().options.useNewUrlParser).toBeTruthy()
            expect(s.database().options.auth).toMatchObject({user:"psp-login", password:"psp-password"})
        })
    })
    describe("normal config",()=>{
        test("all expected setup", ()=>{
            expect(s.database().appName).toBe("psp")
            expect(s.database().port).toBe(27017)
        })
    })
})
