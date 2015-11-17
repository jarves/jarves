import {Filter} from '../angular.ts';

@Filter('translate')
export default class Translate {
    constructor(private translator){}

    filter(value) {
        return this.translator.translate(value);
    }
}