import AbstractFieldType from './AbstractFieldType';
import {Field} from '../annotations';
import {eachValue} from '../utils';
import Text from './Text';

@Field('password')
export default class Password extends Text {
    beforeCompile(contents) {
        super(contents);
        contents.attr('type', 'password');
    }
}