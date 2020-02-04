import * as expressCore from "express"

const buildResponse = (data?:any, err?:string): any =>{
    return{
        acessDate: new Date(),
        result:{
            data: data,
            error:err
        }
    }
}

interface ReponseWriter {
    resp: expressCore.Response
    status: number
    error: {
        hasError: boolean,
        msg: string
    }
    data: any
}

const newResponseWriter = (resp:expressCore.Response) : ReponseWriter => {
    return {
        resp: resp,
        status: 0,
        error: {
            hasError: false,
            msg: ""
        },
        data: null
    }
}

type responseConfig = (writer: ReponseWriter) => void

export const withStatusCode = (status: number): responseConfig => {
    return function(writer: ReponseWriter): void {
        writer.status = status
    }
}

export const withCache = (maxAge:number): responseConfig => {
    return function(writer: ReponseWriter): void {
        writer.resp.setHeader("max-age", maxAge)
    }
}

export const withData = (data:any): responseConfig => {
    return function(writer: ReponseWriter): void {
        writer.data = data
    }
}

export const withError = (msg: string): responseConfig => {
    return function(writer: ReponseWriter): void {
        writer.error = {
            hasError:true,
            msg: msg
        }
    }
}

export const writeResponse = (resp: expressCore.Response, ...configs: responseConfig[]): void => {
    const writer = newResponseWriter(resp)
    for (const conf of configs) {
        conf(writer)
    }
    const body = writer.error.hasError ? buildResponse(null, writer.error.msg) : buildResponse(writer.data)
    writer.resp.status(writer.status).json(body)
}
