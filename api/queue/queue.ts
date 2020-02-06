import {connect, NatsConnectionOptions, Payload, Client, NatsError, Msg} from 'ts-nats';

type callbackMsg = (error:Error|null, msg:any) => void
export interface Queue{
    publish(topic:string, data:Object): void
    subscribe(topic:string, cb:callbackMsg) : void
    drain(): Promise<any>
    close(): void
    isClosed(): boolean
}

interface QueueConfig {
    servers: Array<string>
    url: string
    payload: Payload 
}

type config = (queue:QueueConfig) => void

export const withQueueURL = (url:string): config => {
    return (queue:QueueConfig) => {
        queue.url = url
    }
}

export const withPayloadJsonType = (): config => {
    return (queue:QueueConfig) => {
        queue.payload = Payload.JSON
    }
}

export const withPayloadBinaryType = (): config => {
    return (queue:QueueConfig) => {
        queue.payload = Payload.BINARY
    }
}

export const withPayloadStringType = (): config => {
    return (queue:QueueConfig) => {
        queue.payload = Payload.STRING
    }
}

export const withQueueServers = (...servers:string[]): config => {
    return (queue:QueueConfig) => {
        queue.servers = servers
    }
}

export const releaseListener = (conn: Client) : void => {
    conn.on("error", ()=>{
        conn.drain().then(()=> conn.close())   
    })
}

export const connectQueue = async (...configs:config[]): Promise<Queue> => {
    let queueConf: QueueConfig  = {} as QueueConfig

    withPayloadJsonType()(queueConf)

    configs.forEach(config => {
        config(queueConf)
    });
    const opts = queueConf.servers ? {server: queueConf.servers} : {url:queueConf.url}

    const conn = await connect(opts)
    return newQueue(conn)
}

export const newQueue = (conn: Client): Queue => {
    releaseListener(conn)
    return {
        publish: async(topic:string, data:Object):Promise<void> => {
            conn.publish(topic,data)
        },
        subscribe: async(topic:string,cb:callbackMsg):Promise<void> => {
            await conn.subscribe(topic, (error:NatsError|null, msg:Msg):void=>{
                error? cb(error, msg) : cb(null, msg.data)
            })
        },
        drain: async(): Promise<any> => await conn.drain(),
        close: (): void => conn.close(),
        isClosed: (): boolean => conn.isClosed()
    } 
}
