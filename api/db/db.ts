import { MongoClient, Db } from "mongodb"

export interface Reader{
    get<T>(name: string, query: Object): Promise<T | null>
    find<T>(name: string, query: Object): Promise<T[]>
    count(name:string, limit: number, query:Object): Promise<number>
}

export interface Writer{
    insert(name:string, docs:Array<Object>): Promise<string[]>
    update(name:string, filter:Object, query:Object): Promise<Error | null>
    delete(name:string, filter:Object): Promise<Error | null>
}

export interface Database extends Reader, Writer {}

interface DatabaseConfig {
    url: string
    database: string 
    connOpts: Object
}

type config = (db: DatabaseConfig) => void

export const withUrl = (url:string): config => {
    return function(db: DatabaseConfig): void {
        db.url = url
    }
}

export const withConnectionOpts = (opts: Object): config => {
    return function(db: DatabaseConfig): void {
        db.connOpts = opts
    }
}

export const withDatabase = (name: string): config => {
    return function(db: DatabaseConfig): void {
        db.database = name
    }
}

export const connDB = async (...confs: config[]): Promise<Database> => {
    let db: DatabaseConfig = {} as DatabaseConfig

    confs.forEach(conf => {
        conf(db)
    });

    return new Promise((resolver, reject) => {
        MongoClient.connect(db.url, db.connOpts, function(error:Error, cli:MongoClient){
            if(error){
                reject(error)
                return
            }
            resolver(newDB(cli.db(db.database)))
        })
    })
}

const newDB = (cli: Db): Database => {
    return {
        insert: async (name: string, docs: Object[]): Promise<string[]> => {
            const result = await cli.collection(name).insertMany(docs)
            const ids = result ? result.insertedIds : {};
            const resultIds = Object.keys(ids).map(function(item, index) {
                return ids[index]
            });
            return resultIds;
        },
        update: async(name: string, filter: Object, query: Object): Promise<Error|null> => {
            try{
                const result = await cli.collection(name).findOneAndUpdate(filter, query)
                if (!result.ok){
                    return new Error("update on database has failed");
                }
                return null;
            }catch(err){
                return err
            }
        },
        delete: async (name: string, filter: Object): Promise<Error|null>  => {
            try{
                const result = await cli.collection(name).deleteMany(filter)
                return result.deletedCount ? result.deletedCount <= 0 ? new Error("could not delete documents based on filter") : null : new Error("could not delete documents based on filter")
            }catch(err){
                return err;
            }
        },
        get: async <T>(name: string, query: Object): Promise<T|null> =>{
            return await cli.collection(name).findOne(query)
        },
        find:async<T>(name: string, query: Object): Promise<T[]> => {
            return await cli.collection(name).find(query).toArray()
        },
        count: async (name: string, limit: number=10, query:Object): Promise<number>  => {
            try{
                return await cli.collection(name).countDocuments(query, {limit:limit});
            }catch(err){
                return 0;
            }
        }
    }
}


