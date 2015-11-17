import {Directive} from '../angular.ts';

@Directive('windowContent', {
    restrict: 'E',
    require: '^jarvesWindow',
})
export default class WindowContent {
    link(scope, element, attributes, controller) {
        controller.setContent(element);
    }
}