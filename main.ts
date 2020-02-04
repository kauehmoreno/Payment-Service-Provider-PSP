import * as express from 'express';
import *as env from 'dotenv';


const application = express()

const envSetup = () => {
    const result = env.config()
    if(result.error){
        throw new Error(`could not load .env file: ${result.error.message}`)
    }
}

envSetup()

application.listen(8000, ()=> console.log(`application running on port:8000`))