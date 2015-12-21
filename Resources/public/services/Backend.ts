import {Injectable} from "angular2/core";
import {eachKey} from "../utils";
import EmitterPromise from "../EmitterPromise";
import BackendLogger from "./BackendLogger";
import {BackendLog} from "./BackendLogger";
import JarvesSession from "./JarvesSession";

export class Request {
    public headers:Object = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    constructor(public url:string, public method:string, public body:any = null, public headers:Object = {}) {
        if (this.headers['Content-Type'] === 'application/json' && typeof this.body !== 'string') {
            this.body = JSON.stringify(this.body);
        }
    }
}

export class Response {
    status:number;
    headers:Object = {};
    body:any;
    originalBody:string;
    xhr:XMLHttpRequest;
    request:Request;

    constructor(x:XMLHttpRequest, request:Request) {
        this.request = request;
        this.status = x.status;
        this.body = this.originalBody = x.responseText;
        this.xhr = x;

        this.headers = {};
        var responseHeader:string = x.getAllResponseHeaders();
        var seperatorPosition:number, seperatorSize:number;
        if (responseHeader) {
            for (let header of responseHeader.split("\n")) {
                seperatorPosition = header.indexOf(': ');
                seperatorSize = 2;

                if (seperatorPosition === -1) {
                    seperatorPosition = header.indexOf(':');
                    seperatorSize = 1;
                }
                this.headers[header.substr(0, seperatorPosition)] = header.substr(seperatorPosition + seperatorSize);
            }
        }
    }
}

@Injectable()
export default class Backend {
    constructor(protected backendLogger:BackendLogger, protected jarvesSession:JarvesSession) {
    }

    public newXhr(request:Request):EmitterPromise {
        var x = new (XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');

        x.open(request.method, request.url, 1);
        for (let name of eachKey(request.headers)) {
            x.setRequestHeader(name, request.headers[name]);
        }

        return new EmitterPromise((resolve, reject, eventEmitter) => {
            x.addEventListener("progress", event => eventEmitter('download', event));
            if (x.upload) {
                x.upload.addEventListener("progress", event => eventEmitter('upload', event));
            }

            var handleError = (response:Response, reason:string = '') => {
                var log = new BackendLog();
                log.title = 'Failed to request server';
                log.reason = reason;
                log.response = response;

                this.backendLogger.addLog(log);
                eventEmitter('error');

                return reject();
            };

            x.addEventListener("error", () => {
                var response = new Response(x, request);
                handleError(response, 'error');
            });
            x.addEventListener("abort", () => {
                var response = new Response(x, request);
                handleError(response, 'aborted');
            });

            x.addEventListener('load', function () {
                var response = new Response(x, request);

                try {
                    response.body = JSON.parse(response.originalBody);
                } catch (e) {
                    return handleError(response, 'No valid JSON');
                }

                if (response.status < 400) {
                    eventEmitter('success', response);
                    resolve(response);
                } else {
                    return handleError(response);
                }
            });

            x.send(request.body);
        });
    }

    public buildUrl(url, queryString?:Object|string): string {
        if ('string' === typeof queryString) {
            return this.jarvesSession.baseUrlApi + url + '?' + queryString;
        } else if (queryString) {
            return this.jarvesSession.baseUrlApi + url + '?' + $.param(queryString);
        } else {
            return this.jarvesSession.baseUrlApi + url;
        }
    }

    public post(url:string, queryString?:Object|string, data?:Object):EmitterPromise {
        return this.newXhr(new Request(this.buildUrl(url, queryString), 'POST', data));
    }

    public put(url, queryString?:Object|string, data?) {
        return this.newXhr(new Request(this.buildUrl(url, queryString), 'PUT', data));
    }

    public patch(url, queryString?:Object|string, data?) {
        return this.newXhr(new Request(this.buildUrl(url, queryString), 'PATCH', data));
    }

    public options(url, queryString?:Object|string) {
        var data = {_method: 'options'};
        return this.newXhr(new Request(this.buildUrl(url, queryString), 'POST', data));
    }

    public get(url, queryString?:Object|string) {
        return this.newXhr(new Request(this.buildUrl(url, queryString), 'GET'));
    }

    public delete(url, queryString?:Object|string) {
        return this.newXhr(new Request(this.buildUrl(url, queryString), 'DELETE'));
    }

    public head(url, queryString?:Object|string) {
        return this.newXhr(new Request(this.buildUrl(url, queryString), 'HEAD'));
    }
}