import {Directive} from '../annotations';

@Directive('button', {
    restrict: 'E'
})
export default class Button {
    link(scope, element, attributes) {
        element.addClass('jarves-Button');
        if (attributes['pressed']) {
            scope.$watch(attributes['pressed'], (pressed) => {
                if (pressed) {
                    element.addClass('jarves-Button-pressed');
                } else {
                    element.removeClass('jarves-Button-pressed');
                }
            });
        }
    }
}