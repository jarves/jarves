import AbstractLabel from './AbstractLabel';
import {Label} from '../annotations';

@Label('checkbox')
export default class Checkbox extends AbstractLabel {
    link(scope, element, attr) {
        this.renderTemplate(
            '<span ng-class="{\'icon-checkmark-2\': %s, \'icon-cross\': !%s}"></span>'
                .sprintf(this.getParentModelName(), this.getParentModelName())
        );
    }
}