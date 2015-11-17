import {Directive} from '../angular.ts';

@Directive('jarvesWindow', {
    restrict: 'E',
    priority: -1,
    scope: {
        'windowInfo': '=',
        'windowId': '=',
        'isInline': '=',
        'parentWindowId': '=',
        'parameters': '='
    },
    templateUrl: 'bundles/jarves/views/window.html',
    controller: 'bundles/jarves/controller/WindowController'
})
export default class Window {
}