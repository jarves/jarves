import AbstractLabel from './AbstractLabel.js';
import {Label} from '../angular.js';

@Label('checkbox')
export default class Checkbox extends AbstractLabel {
    link(scope, element, attr) {
        this.renderTemplate(
            '<span ng-class="{\'icon-checkmark-2\': %s, \'icon-cross\': !%s}"></span>'
                .sprintf(this.getParentModelName(), this.getParentModelName())
        );
    }
}