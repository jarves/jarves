import {Pipe} from 'angular2/core';

@Pipe({name: 'latest'})
export class LatestPipe {
    transform(value:Array, args:string[]) : any {
        if (!value || !value.length) {
            return null;
        }
        return value[value.length - 1];
    }
}

@Pipe({name: 'first'})
export class FirstPipe {
    transform(value:Array, args:string[]) : any {
        if (!value || !value.length) {
            return null;
        }

        return value[0];
    }
}
