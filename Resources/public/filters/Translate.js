import {Filter, InjectAsProperty} from '../annotations';

@Filter('translate')
@InjectAsProperty('translator')
export default class Translate {
    filter(value) {
        return this.translator.translate(value);
    }
}