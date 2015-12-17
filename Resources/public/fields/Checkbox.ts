import AbstractFieldType from './AbstractFieldType.ts';
import {Field} from '../angular.ts';
import {each} from '../utils.ts';
import angular from '../angular.ts'

@Field('checkbox', {
    templateUrl: 'bundles/jarves/views/fields/checkbox.html'
})
export default class Checkbox extends AbstractFieldType {
    public checked:boolean = false;

    link(scope, element, attr, controller, transclude) {
        super.link(...arguments);

        this.onModelValueChange((value) => {
            this.checked = !!value;
        });
    }

    public toggle() {
        this.checked = !this.checked;
        this.setModelValue(this.checked);
    }
}