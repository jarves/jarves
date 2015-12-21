import {Pipe} from 'angular2/core';

@Pipe({name: 'dump'})
export class DumpPipe {
    transform(value:any, args:string[]) : any {
        return JSON.stringify(value);
    }
}