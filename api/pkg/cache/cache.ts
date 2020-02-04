import * as provider from 'redis';

type Marshaller = (value: any, replacer?: ((this: any, key: string, value: any) => any) | undefined, space?: string | number | undefined) => string
type CallbackResponser<T> = (err:Error|null, reply:any) => any

export interface Storager{
    get<T>(key:string, cb:CallbackResponser<T>): Promise<T>
    set<T>(key:string, value: T, marshaller:Marshaller): Promise<boolean>
    delete(key:string):Promise<boolean>
}

export interface StorageSetup {
    host: string
    port:number
    keepalive: boolean
    connectTimeout: number
    password:string
}


type config = (storage: StorageSetup) => void

export const withHost = (host: string):config => {
    return function(s: StorageSetup){
        s.host = host
    }
}
export const withPort = (port: number):config => {
    return function(s: StorageSetup){
        s.port = port
    }
}
export const withKeepAlive = (keepAlive: boolean):config => {
    return function(s: StorageSetup){
        s.keepalive = keepAlive
    }
}
export const withConnTimeout = (timeout: number):config => {
    return function(s: StorageSetup){
        s.connectTimeout = timeout
    }
}

export const withPassword = (password: string):config => {
    return function(s: StorageSetup){
        s.password = password
    }
}

export const connectStorage = (...configs: config[]): Storager => {
    let storageSetup: StorageSetup = {} as StorageSetup
    configs.forEach(config => config(storageSetup))

        const cli = provider.createClient({
            host: storageSetup.host,
            port: storageSetup.port,
            socket_keepalive: storageSetup.keepalive,
            connect_timeout: storageSetup.connectTimeout,
            password:storageSetup.password,
        })

    return newStorage(cli)
}


export const newStorage = (cli: provider.RedisClient): Storager => {
    return {
        get: async <T>(key: string, cb: CallbackResponser<T>): Promise<any> => {
            return cli.get(key, cb)
        },
        set: async <T>(key: string, value:T, marshaller: Marshaller): Promise<boolean> => {
            try{
                cli.set(key, marshaller(value))
                return Promise.resolve(true)
            }catch(err){
                return Promise.resolve(false)
            }
        },
        delete: async (key:string):Promise<boolean> => {
            return await new Promise((resolve, reject)=>{
                cli.del(key, (error:Error|null, ok: any)=>{
                    if(error){
                        reject(error)
                        return
                    }
                    resolve(ok)
                })
            })
        },
    }
}
