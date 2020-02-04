import { Settings } from "../../settings/settings";
import {Express } from 'express';
import { EventEmitter } from "events";
import * as logger from 'bunyan';
import { Database } from "../pkg/db/db";
import { Storager } from "../pkg/cache/cache";

export interface ServerConf {
    app:Express 
    settings: Settings
    database?: Database
    storage?: Storager
    event: EventEmitter
    log: logger
}

export const serverBuild = (app: Express, settings: Settings): ServerConf => {
    return {
        app: app,
        settings:settings,
        log: logger.createLogger({
            name:settings.aplication().appName,
            level:settings.aplication().logLevel
        }),
        event: new EventEmitter()
    }
}
