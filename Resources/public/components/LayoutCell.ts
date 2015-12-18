import {Directive, angular} from '../angular.ts';
import Hammer from '../Hammer.js';

@Directive('layoutCell', {
    restrict: 'E',
    transclude: true,
    template: '<div class="jarves-layout-cell-container" ng-transclude></div>'
})
export default class LayoutCell {
    constructor(private $compile, private $interpolate) {}

    link(scope, element, attributes) {
        if (attributes.width) {
            var width = this.$interpolate(attributes.width)(scope);
            if (width == Number(width)) {
                width += 'px';
            }
            element.css('width', width);
        }

        if (attributes.resizer) {
            var resizerWidth = attributes.resizerWidth+0 || '30px';

            var sizerCell = angular.element('<layout-cell width="' + resizerWidth + '"><div class="jarves-LayoutCell-resizer jarves-LayoutCell-resizer-horizontal"></div></layout-cell>');

            if ('right' === attributes.resizer.toLowerCase()) {
                element.after(sizerCell);
            } else {
                element.before(sizerCell);
            }

            this.$compile(sizerCell)(scope);

            var hammer = new Hammer(angular.element(sizerCell.children()[0]).children()[0], {});
            var currentWidth = parseInt(element.css('width') || element[0].offsetWidth);
            hammer.on('panleft panright panend', (ev) => {
                element.css('width', (currentWidth + ev.deltaX)+'px');
                if ('panend' === ev.type) {
                    currentWidth = currentWidth + ev.deltaX;
                }
            });

        }
    }
}