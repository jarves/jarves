import {Filter, InjectAsProperty} from '../angular.js';

@Filter('translate')
@InjectAsProperty('translator')
export default class Translate {
    filter(value) {
        return this.translator.translate(value);
    }
}