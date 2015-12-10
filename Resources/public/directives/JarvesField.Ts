import {Directive, Inject} from '../angular.ts';
import AbstractFieldType from '../fields/AbstractFieldType.ts';

@Directive('jarvesField', {
    restrict: 'E',
    priority: 5000,
    terminal: true,
    //compile: function(element, attributes){
    //    var children = element.children().remove();
    //}
})
@Inject('$scope, $element, $attrs, $compile, $http, $templateCache, $q')
export default class JarvesField {
    private transclude;
    private controller;

    private lastType:string;

    constructor(private $scope, private $element, private $attrs, private $compile) {
        //console.info('constructor jarvesField.ts');
    }

    link(scope, element, attributes, controller, transclude) {
        //console.info('link jarvesField.ts', !!transclude);
        this.transclude = transclude;

        if (attributes['definition']) {
            scope.penis = 1;
            this.$scope.$watch(attributes['definition'], (definition) => {
                if (this.lastType) {
                    element.removeAttr(this.lastType);
                    scope.$broadcast('$destroy');
                    element.children().remove();
                }

                if (!definition) {
                    throw 'invalid value for definition attribute in <jarves-field definition="%s" />'.sprintf(this.$attrs.definition);
                }
                this.load(definition);
            });
        } else {

            if (!attributes.type) {
                console.error('no type define in <jarves-field />', attributes);
            }
            this.load(attributes);
        }
    }

    load(definition) {
        if (!definition.type) {
            throw 'type for jarves-field not defined';
        }

        this.lastType = 'jarves-%s-field'.sprintf(definition.type.lcfirst());
        this.$element.attr(this.lastType, '');
        //console.log('compile jarvesField.ts', 'jarves-%s-field'.sprintf(definition.type.lcfirst()));
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