import {Directive, InjectAsProperty} from '../angular.ts';
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
            var resizerWidth = attributes.resizerWidth || '30px';

            var sizerCell = angular.element('<layout-cell width="30"></layout-cell>');
            var sizer = angular.element('<div class="jarves-LayoutCell-resizer jarves-LayoutCell-resizer-horizontal"></div>');
            sizerCell.append(sizer);

            if ('right' === attributes.resizer.toLowerCase()) {
                element.after(sizerCell);
            } else {
                element.before(sizerCell);
            }

            this.$compile(sizerCell)(scope);

            var hammer = new Hammer(sizer[0], {});
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