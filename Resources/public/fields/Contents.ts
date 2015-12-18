import AbstractFieldType from './AbstractFieldType.ts';
import {Field} from '../angular.ts';
import {each} from '../utils.ts';
import angular from '../angular.ts'

@Field('contents', {
    scope: true,
    template: `
    <div>
        <iframe ng-src="jarvesField.iFrameUrl"></iframe>
    </div>
    `
})
export default class Checkbox extends AbstractFieldType {
    public iFrameUrl:string = '';

    link(scope, element, attr, controller, transclude) {
        super.link(...arguments);

        this.onModelValueChange((value) => {

        });
    }
}