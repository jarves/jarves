import AbstractLabel from './AbstractLabel.js';
import {Label} from '../angular.js';

@Label('date')
export default class Date extends AbstractLabel {
    link(scope, element, attr) {
        // var value = values[this.fieldId] || '';
        // if (value != 0 && value) {
        //     var format = ( !this.definition.format ) ? '%d.%m.%Y' : this.definition.format;
        //     return new Date(value * 1000).format(format);
        // }

        // return '';
    }
}