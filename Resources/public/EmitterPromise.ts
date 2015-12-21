export interface Executor {
    (resolve:Function, reject:Function, eventEmitter:(eventName, ...eventArguments) => any):any;
}

export default class EmitterPromise {
    protected promise:Promise;
    protected eventQueue:Object = {};
    protected eventListener:Object = {};

    constructor(executor:Executor) {
        var eventEmitter = (eventName:string, ...eventArguments) => {
            if (!this.eventQueue[eventName]) {
                this.eventQueue[eventName] = [];
            }

            this.eventQueue[eventName].push(eventArguments);

            if (this.eventListener[eventName]) {
                for (let listener of this.eventListener[eventName]) {
                    listener(...eventArguments);
                }
            }
        };

        var standardExecutor = function (resolve, reject) {
            executor(resolve, reject, eventEmitter);
        };

        this.promise = new Promise(standardExecutor);
        this.promise.catch(() => this.catch(...arguments));
        this.promise.then(() => this.then(...arguments));
    }

    public catch(onRejected:Function) {
        return this.promise.catch(onRejected);
    }

    public on(eventName:string, callback:Function):EmitterPromise {
        if (!this.eventListener[eventName]) {
            this.eventListener[eventName] = [];
        }

        if (this.eventQueue[eventName]) {
            for (let args of this.eventQueue[eventName]) {
                callback(...args);
            }
        }

        this.eventListener[eventName].push(callback);

        return this;
    }

    public then(onFulfilled:Function, onRejected?:Function) {
        return this.promise.then(onFulfilled, onRejected);
    }
}