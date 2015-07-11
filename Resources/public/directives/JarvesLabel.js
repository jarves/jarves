import {Directive} from '../angular.js';
import {each} from '../utils.js';

@Directive('jarvesLabel', {
    restrict: 'E',
    priority: 5000,
    terminal: true
})
export default class JarvesLabel {
    constructor($scope, $element, $attrs, $compile, $interpolate, jarves) {
        this.$scope = $scope;
        this.$element = $element;
        this.$attrs = $attrs;
        this.$compile = $compile;
        this.$interpolate = $interpolate;
        this.jarves = jarves;

        this.object = null;
        this.data = null;
        this.column = null;
        this.id = null;
    }

    link(scope, element, attributes) {
        if (this.$attrs.definition) {
            this.$scope.$watch(this.$attrs['definition'], (definition) => {
                this.load(definition);
            });
        } else {
            var definition = {};
            var interpolate = {'object': true, 'id': true, 'type': true};

            for (let [key, value] of each(attributes)) {
                if (key in interpolate) {
                    definition[key] = this.$interpolate(value)(this.$scope);
                } else {
                    definition[key] = this.$scope.$eval(value);
                }
            }

            this.load(definition);
        }
    }

    load(definition) {
        if (!definition.type) {
            console.error(definition);
            throw 'no type defined in <jarves-label>';
        }
        this.$element.attr('jarves-%s-label'.sprintf(definition.type.lcfirst()), '');
        this.$compile(this.$element, null, 5000)(this.$scope);
    }
}