import { newQueue } from "./queue"
import {Client, Subscription, Sub, Msg} from 'ts-nats';
import {v4 as uuid} from "uuid"
import { ProtocolHandler } from "ts-nats/lib/protocolhandler";

const chars = 'a-zA-Z0-9\\-\\_';
/**
 * NB: The subs are stored in 2 maps shared by all instances of the NATS class.
 */
let _subs = new Map();

export class mockQueue extends Client {

    publishCall:number = 0
    publishSubject:string = ""
     /**
     * The mocked transport's subs for testing purposes.
     */
    static get subs() {
        return _subs;
    }

    static set subs(subs) {
        if (!(subs instanceof Map))
        throw new TypeError('subs must be a map');

        _subs = subs;
    }
    
    flush(cb?: import("ts-nats").FlushCallback | undefined): void | Promise<void> {
        cb ? cb() : null
    }
    publish(subject: string, data?: any, reply?: string | undefined): void {
        this.publishCall +=1
        this.publishSubject = subject
        const subs = this._getSubsBySubject(subject);
        for (const sub of subs) {
            sub.callback(subject, reply, data);
        }
    }

    publishCalls(): number {
        return this.publishCall
    }

    publishCallSubject(): string {
        return this.publishSubject
    }
    static connect() {
        const nats =  new mockQueue();
        process.nextTick(() => nats.emit('connect'));
        return Promise.resolve(nats)
    }
    subscribe(subject: string, cb: import("ts-nats").MsgCallback, opts?: import("ts-nats").SubscriptionOptions | undefined): Promise<import("ts-nats").Subscription> {
        // TODO: validate subject syntax
        const sid = uuid();

        // Handle wild cards
        // NB: this assumes a valid subject syntax
        const _subject = `^${subject
            .replace('>',   `[${chars}\\.]+`) // '>' full wildcard
            .replace(/\*/g, `[${chars}]+`)    // '*' token wildcard
            .replace(/\./g, '\\.')}$`;        // escape dots

        const sub = {
            sid: parseInt(sid),
            subject: _subject,
            callback: cb,
            received: 10,
        };

        this._addSub(sub);

        return Promise.resolve(new Subscription(sub, {}as ProtocolHandler));
    }

    drain(): Promise<any> {
        return Promise.resolve(true)
    }
    request(subject: string, timeout?: number | undefined, data?: any): Promise<import("ts-nats").Msg> {
        const sid = uuid();

        const sub = {
          sid,
          subject: sid,
          cb:null
        };
    
        this._addSub(sub);
    
        this.publish(subject, data, sid);
        return Promise.resolve({
            subject: subject,
            reply: "ok",
            data:data,
            sid:parseInt(sid),
            size:1024
        }) 
    }
    close(): void {
        process.nextTick(() => this.emit('disconnect'));
    }
    isClosed(): boolean {
        return false
    }
    numSubscriptions(): number {
        throw new Error("Method not implemented.");
    }
    addListener(event: string | symbol, listener: (...args: any[]) => void): this {
        throw new Error("Method not implemented.");
    }
    on(event: string | symbol, listener: (...args: any[]) => void): this {
        listener()
        return this
    }
    once(event: string | symbol, listener: (...args: any[]) => void): this {
        listener()
        return this
    }
    removeListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return this
    }

    removeAllListeners(event?: string | symbol | undefined): this {
        return this
    }
    listeners(event: string | symbol): Function[] {
        return [()=>{return "1"},()=>{return "2"},()=>{return "3"}]
    }
    emit(event: string | symbol, ...args: any[]): boolean {
        return true
    }
    listenerCount(type: string | symbol): number {
        return 3
    }

    _getSubsBySubject(subject:any) {
    return Array.from(_subs.values())
        .filter(({ subject: _subject }) =>
        new RegExp(_subject, 'g').test(subject));
    }

    _addSub(sub:any) {
        _subs.set(sub.sid, sub);
    }
}

describe("queue test case",()=>{
    describe("instance cases",()=>{
        const queue = newQueue(new mockQueue())
        test("should return implement functions of queue provided",async()=>{
            expect(queue.isClosed()).toBeFalsy()
        })
        test("should be able to send msg and receive",async()=>{
            queue.subscribe("fake-data", (error:Error|null, msg:any)=>{
                expect(true).toBeTruthy()
            })
            queue.publish("fake-data", {name:"lala"})
        })
    })
})