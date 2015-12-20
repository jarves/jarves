import {baseUrlApi} from '../config';
import {Injectable} from "angular2/core";
import {eachKey} from "../utils";
import EmitterPromise from "../EmitterPromise";
import EmitterPromise from "../EmitterPromise";
import EmitterPromise from "../EmitterPromise";
import EmitterPromise from "../EmitterPromise";

class Request {
    public headers:Object = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    constructor(public method:string, public url:string, public body:any, public headers?:Object) {
        if (this.headers['Content-Type'] === 'application/json' && typeof this.body !== 'string') {
            this.body = JSON.stringify(this.body);
        }
    }
}

class Response {
    status:number;
    headers:Object;
    body:any;
    originalBody:string;
    xhr:XMLHttpRequest;
    request:Request
}

@Injectable()
export default class Backend {
    constructor() {
    }

    /**
     *
     * @param {String} url relative url
     * @returns {String}
     */
    getUrl(url) {
        if (!url) {
            throw new 'No url defined';
        }
        return baseUrlApi + url;
    }

    preparePromise(httpPromise):EmitterPromise {
        httpPromise.error(this.handleError);

        return httpPromise;
    }

    handleError(response) {
        //todo, show shiny box right bottom with information at the UI.
        console.error('request failed', response);
    }

    get(url, config?) {
        return this.preparePromise(this.http.get(this.getUrl(url), config));
    }

    delete(url, config?) {
        return this.preparePromise(this.http.delete(this.getUrl(url), config));
    }

    head(url, config?) {
        return this.preparePromise(this.http.head(this.getUrl(url), config));
    }

    public newXhr(request:Request):EmitterPromise {
        var x = new (XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');

        x.open(request.method, request.url, 1);
        for (let name in eachKey(request.headers)) {
            x.setRequestHeader(name, request.headers[name]);
        }

        return new EmitterPromise(function (resolve, reject, eventEmitter) {

            x.addEventListener("progress", event => eventEmitter('download', event));
            if (x.upload) {
                x.upload.addEventListener("progress", event => eventEmitter('upload', event));
            }

            x.addEventListener("error", () => {
                //throw an error
                //action required
            });
            x.addEventListener("abort", () => {
                //action required
            });

            x.onreadystatechange = function () {
                if (x.readyState > 3) {
                    var response = new Response();
                    response.request = request;
                    response.status = x.status;
                    response.body = response.originalBody = x.responseText;
                    response.xhr = x;

                    try {
                        response.body = JSON.parse(response.originalBody);
                    } catch (e) {
                        eventEmitter('error');
                        return reject();
                    }

                    if (response.status > 200 && response.status < 400) {
                        eventEmitter('success', response);
                        resolve(response);
                    } else {
                        //log and show popup
                        eventEmitter('error');
                        reject(response);
                    }
                }
            };

            x.send();
        });
    }

    public post(url:string, data?:Object):EmitterPromise {
        return this.newXhr(new Request('POST', url, data));
    }

    put(url, data?, config?) {
        return this.preparePromise(this.http.put(this.getUrl(url), data, config));
    }

    patch(url, data?, config?) {
        return this.preparePromise(this.http.patch(this.getUrl(url), data, config));
    }

    options(url, config?) {
        var data = {_method: 'options'};
        return this.preparePromise(this.http.post(this.getUrl(url), data, config));
    }
}