import {Response} from "./Backend";

export class BackendLog {
    public id:number;
    public title:string;
    public reason:string;
    public message:string;
    public response:Response;
}

export default class BackendLogger {
    public errors:Array<BackendLog> = [];

    public addLog(log:BackendLog) {
        if (!log.id) {
            log.id = this.errors.length + 1;
        }

        this.errors.push(log);
    }
}