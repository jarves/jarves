import AbstractFieldType from './AbstractFieldType.ts';
import {Field} from '../angular.ts';
import {eachValue} from '../utils.ts';
import Text from './Text.ts';

@Field('password', {
    templateUrl: 'bundles/jarves/views/field.text.html',
    scope: {
        'placeholder': '@',
        'model': '='
    }
})
export default class Password extends AbstractFieldType {
    static compile(element, attributes) {
        element.children().attr('type', 'password');
    }
}