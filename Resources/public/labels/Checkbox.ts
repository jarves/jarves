import AbstractLabel from './AbstractLabel.ts';
import {Label} from '../angular.ts';

@Label('checkbox')
export default class Checkbox extends AbstractLabel {
    link(scope, element, attr) {
        super.link(...arguments);
        this.renderTemplate(
            '<span ng-class="{\'icon-checkmark-2\': %s, \'icon-cross\': !%s}"></span>'
                .sprintf(this.getParentModelName(), this.getParentModelName())
        );
    }
}