import {Directive, Inject} from '../annotations';
import AbstractFieldType from '../fields/AbstractFieldType';

@Directive('jarvesField', {
    restrict: 'E',
    priority: 5000,
    terminal: true
})
@Inject('$scope, $element, $attrs, $compile, $http, $templateCache, $q')
export default class JarvesField {
    constructor($scope, $element, $attrs, $compile, $http, $templateCache, $q) {
        this.$scope = $scope;
        this.$element = $element;
        this.$attrs = $attrs;
        this.$compile = $compile;
        this.$http = $http;
        this.$templateCache = $http;
        this.$q = $q;
    }

    link(scope, element, attributes) {
        if (attributes['definition']) {
            this.$scope.$watch(attributes['definition'], (definition) => {
                this.load(definition);
            });
        } else {
            this.load(attributes);
        }
    }

    load(definition) {
        if (!definition) {
            throw 'invalid value for definition attribute in <jarves-field definition="%s" />'.sprintf(this.$attrs.definition);
        }
        if (!definition.type) {
            console.error(definition);
            throw 'no type define in <jarves-field />';
        }
        this.$element.attr('jarves-%s-field'.sprintf(definition.type.lcfirst()), '');
        this.$compile(this.$element, null, 5000)(this.$scope);
    }

    /**
     *
     * @param {AbstractFieldType} controller
     */
    setController(controller){
        this.controller = controller;
    }

    /**
     * @returns {AbstractFieldType}
     */
    getController() {
        return this.controller;
    }
}