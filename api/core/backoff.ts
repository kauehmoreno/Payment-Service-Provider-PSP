const pause = (duration:number) => new Promise(res => setTimeout(res, duration));

type onError = (error:Error) => void

export const backoff = (retries:number, fn: () => Promise<any>, delay = 500, cbOnError:onError) =>{
    fn().catch(err => {
      if(retries >1){
        pause(delay).then(() => backoff(retries - 1, fn, delay * 2, cbOnError))
        return
      }
      cbOnError(new Error(`[backoff failure]: ${err.message}`))
    })
}