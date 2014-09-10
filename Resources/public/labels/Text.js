import AbstractLabel from './AbstractLabel';
import {Label} from '../annotations';

@Label('text')
export default class Text extends AbstractLabel {
    link(scope, element, attr) {
        var span = angular.element('<span></span>');
        span.attr('ng-bind', this.getModelName());
        this.renderTemplate(span);
    }
}