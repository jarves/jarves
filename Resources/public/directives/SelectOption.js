import {Directive} from '../angular.js';

@Directive('selectOption', {
    restrict: 'E',
    require: ['^jarvesSelectField'],
})
export default class SelectOption {
    link(scope, element, attributes, controller) {
        console.info('link selectOption', controller);
        if (controller) {
            var value = this.parseValues(element, attributes);
            console.log('selectoption new value', value);
            controller.addOption(value);

            element.addClass('ng-hide');

            scope.$watch(() => {
                return element.text();
            }, () => {
                var oldValueId = value.id;
                value = this.parseValues(element, attributes);
                controller.setOption(oldValueId, value);
            });
        }
    }

    parseValues(element, attributes) {
        var label = element.text();
        var id = attributes.id ? attributes.$eval(attributes.id) : label;
        var icon = attributes.icon;

        return {
            label: label,
            id: id,
            icon: icon
        };
    }
}