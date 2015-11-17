import {Filter} from '../angular.ts';

@Filter('toArray')
export default class ToArray {
    // constructor(){
    //     return this.filter;
    // }

    filter(obj) {
        if (!(obj instanceof Object)) {
            return obj;
        }

        return Object.keys(obj).map(function (key) {
            return Object.defineProperty(obj[key], '$key', {__proto__: null, value: key});
        });
    }
}