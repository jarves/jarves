import AbstractLabel from './AbstractLabel.js';
import {Label} from '../angular.js';

@Label('text')
export default class Text extends AbstractLabel {
    link(scope, element, attr) {
        var span = angular.element('<span></span>');
        span.attr('ng-bind', this.getModelName());
        this.renderTemplate(span);
    }
}