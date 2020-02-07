const retry = (retries: number, fn: () => Promise<any>) => {
    fn().catch(err => retries > 1 ? retry(retries - 1, fn) : Promise.reject(err));
}

const pause = (duration:number) => new Promise(res => setTimeout(res, duration));

export const backoff = (retries:number, fn: () => Promise<any>, delay = 500) =>{
    fn().catch(err => retries > 1
      ? pause(delay).then(() => backoff(retries - 1, fn, delay * 2))
      : Promise.reject(err));
}

