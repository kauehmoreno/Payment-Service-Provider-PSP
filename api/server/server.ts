import {Express } from 'express';
import { Database } from "../db/db";
import { EventEmitter } from "events";
import * as logger from 'bunyan';
import { Storager } from "../cache/cache";
import { Settings } from '../settings/settings';
import { Queue } from '../queue/queue';


export interface ServerConf {
    app:Express 
    settings: Settings
    database?: Database
    storage?: Storager
    event: EventEmitter
    queue: Queue
    log: logger
}

type config = (s: ServerConf) => void


export const serverWithQueue = (q: Queue): config =>{
    return (s:ServerConf) => {
        s.queue = q
    }
}

export const serverBuild = (app: Express, settings: Settings, ...config:config[]): ServerConf => {
    const server = {
        app: app,
        settings:settings,
        log: logger.createLogger({
            name:settings.aplication().appName,
            level:settings.aplication().logLevel
        }),
        event: new EventEmitter(),
        queue: {} as Queue
    }

    config.forEach(conf => {
        conf(server)
    });
    return server
}
