import {Directive, angular} from '../angular.ts';
import {each} from '../utils.ts';

@Directive('jarvesObjectLabel', {
    restrict: 'E',
    scope: true
})
export default class JarvesObjectLabel {
    public object;
    public data;
    public column;
    public id;

    constructor(private $scope, private $element, private $attrs, private $compile, private $interpolate, private jarves) {
    }

    link(scope, element, attributes) {
        //scope.$watch('item', function(item) {
        //
        //});

        scope.$watchGroup([attributes.item, attributes.object, attributes.labelField, attributes.template],
            (values) => {
                [scope.item, scope.object, scope.labelField, scope.template] = values;

                if (!scope.object) {
                    throw 'attribute object for <jarves-object-label> not defined';
                }

                if (!scope.item) {
                    throw 'attribute item for <jarves-object-label> not defined';
                }

                var labelField = scope.labelField || this.jarves.getObjectDefinition(scope.object).labelField;

                var template = scope.template || '<span>{{label}}</span>';
                element.html(template);

                scope.label = scope.item[labelField];
                this.$compile(element.children())(scope);
            });
    }

    load(definition) {
    }
}