import AbstractFieldType from './AbstractFieldType.js';
import {Field} from '../angular.js';
import {eachValue} from '../utils.js';
import Text from './Text.js';

@Field('password')
export default class Password extends Text {
    beforeCompile(contents) {
        parent(contents);
        contents.attr('type', 'password');
    }
}