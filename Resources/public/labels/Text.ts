import AbstractLabel from './AbstractLabel.ts';
import {Label, angular} from '../angular.ts';

@Label('text')
export default class Text extends AbstractLabel {
    link(scope, element, attr) {
        super.link(...arguments);
        var span = angular.element('<span></span>');
        span.attr('ng-bind', this.getModelName());
        this.renderTemplate(span);
    }
}