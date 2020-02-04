import { validateCustomError } from "./validator"

describe("validator case",()=>{
    describe("custom error",()=>{
        test("should include code error on validateCustomError",()=>{
            const error = new Error("my mock erro")
            const customError  = validateCustomError(error)
            expect(customError.code).toBe(400)
            expect(customError.name).toBe(error.name)
            expect(customError.stack).toBe(error.stack)
            expect(customError.message).toBe(error.message)
        })
    })
})