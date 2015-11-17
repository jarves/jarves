import AbstractLabel from './AbstractLabel.ts';
import {Label} from '../angular.ts';

@Label('Datetime')
export default class Datetime extends AbstractLabel {
    link(scope, element, attr) {
        super.link(...arguments);
        // var value = values[this.fieldId] || '';
        // if (value != 0 && value) {
        //     var format = ( !this.definition.format ) ? '%d.%m.%Y %H:%M' : this.definition.format;
        //     return new Date(value * 1000).format(format);
        // }

        // return '';
    }
}