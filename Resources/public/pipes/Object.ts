import {Pipe} from 'angular2/core';

@Pipe({name: 'mapToIterable', pure: false})
export class MapToIterablePipe {
    transform(value: any, args: any[] = null): any {
        return Object.keys(value).map(key => value[key]);
    }
}