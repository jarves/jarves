import {Directive} from '../annotations';

@Directive('button', {
    restrict: 'E'
})
export default class Button {
    link(scope, element, attributes) {

        if (attributes.focus) {
            scope.$watch(attributes.focus, (value) => {
                if (value) {
                    element[0].focus();
                }
            });
        }

        if (attributes['pressed']) {
            scope.$watch(attributes['pressed'], (pressed) => {
                if (pressed) {
                    element.addClass('pressed');
                } else {
                    element.removeClass('pressed');
                }
            });
        }

        var clicked = false;
        element.on('mousedown', function() {
            clicked = true;
        });

        element.on('focus', (e) => {
            setTimeout(() => {
                if (!clicked) {
                    element.addClass('focus');
                }
            }, 10);
        });

        element.on('blur', (e) => {
            element.removeClass('focus');
            clicked = false;
        });
    }
}