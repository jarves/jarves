import {Directive} from '../angular.ts';

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

        if (attributes.loading) {

            var l = Ladda.create(element[0]);
            element.addClass('button-with-ladda');
            scope.$watch(attributes.loading, (value) => {
                if (value) {
                    l.start();
                    if (typeof value === 'number') {
                        l.ladda( 'setProgress', value);
                    }
                } else {
                    l.stop();
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