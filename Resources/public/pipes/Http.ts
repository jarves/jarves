import {Pipe} from 'angular2/core';
import {STATUS_CODES} from "./StatusCodes";

@Pipe({name: 'httpStatusCodeMessage', pure: false})
export class HttpStatusCodeMessagePipe {
    transform(value:any, args:string[]) : any {
        return STATUS_CODES[value];
    }
}