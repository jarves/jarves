import {Directive} from '../annotations';

@Directive('windowFrame', {
    restrict: 'E',
    require: '^jarvesWindow',
})
export default class WindowFrame {
    link(scope, element, attributes, controller) {
        controller.setFrame(element);
    }
}