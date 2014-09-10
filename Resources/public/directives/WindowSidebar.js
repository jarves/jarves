import {Directive} from '../annotations';

@Directive('windowSidebar', {
    restrict: 'E',
    priority: -1,
    require: '^jarvesWindow',
    transclude: true,
    scope: {
        label: '='
    },
    template: '<window-sidebar-container><div class="jarves-Window-sidebar-title">{{label}}</div><div ng-transclude></div></window-sidebar-container>'
})
export default class WindowSidebar {
    link(scope, element, attributes, controller) {
        controller.setSidebar(element);
    }
}