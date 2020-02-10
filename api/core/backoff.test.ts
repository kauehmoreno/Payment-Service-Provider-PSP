import { backoff } from "./backoff"

describe("backoff test case",()=>{
    describe("error cases",()=>{
        test("should call onError on failure attpents",done =>{
            let mock  = jest.fn().mockReturnThis()
            mock.mockRejectedValue(new Error("mock error"))
            backoff(2, mock,0, (error:Error):void => {
                expect(error.message).toBe("[backoff failure]: mock error")
                done()
            })
        })
    })
})