import {Directive} from '../annotations';

@Directive('jarvesText', {
    restrict: 'A'
})
export default class InputText {
    link(scope, element, attributes) {
        var allowedTypes = ['text', 'password'];
        if (!attributes.type || -1 !== allowedTypes.indexOf(attributes.type)) {
            element.addClass('jarves-Input-text');
        }
    }
}