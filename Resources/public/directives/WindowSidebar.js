import {Directive} from '../annotations';

@Directive('windowSidebar', {
    restrict: 'E',
    require: '^jarvesWindow',
    transclude: true,
    scope: {
        label: '@'
    },
    template: '<window-sidebar-container><div class="jarves-Window-sidebar-title">{{label}}</div><div ng-transclude></div></window-sidebar-container>'
})
export default class WindowSidebar {

    link(scope, element, attributes, controller) {
        controller.setSidebar(element);

        var resizerWidth = attributes.resizerWidth || '30px';
        var sizer = angular.element('<div class="jarves-LayoutCell-resizer jarves-LayoutCell-resizer-horizontal jarves-Window-sidebar-resizer"></div>');
        element.append(sizer);

        var hammer = new Hammer(sizer[0], {});
        var currentWidth = parseInt(element.css('width') || element[0].offsetWidth);

        var minWidth = 40;
        var windowFrame, resizerWidthInt = parseInt(resizerWidth), thisWidth;
        hammer.on('panleft panright panend', (ev) => {
            if (!windowFrame) {
                if (!(windowFrame = controller.getFrame())) {
                    return;
                }
            }

            thisWidth = currentWidth - ev.deltaX;
            if (thisWidth < minWidth) {
                thisWidth = minWidth;
            }

            element.css('width', thisWidth+'px');
            windowFrame.css('right', (thisWidth+resizerWidthInt)+'px');
            if ('panend' === ev.type) {
                currentWidth = thisWidth;
            }
        });

    }
}