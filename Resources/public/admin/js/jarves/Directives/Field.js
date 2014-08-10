jarves.Directives.Field = new Class({
    Extends: jarves.Directives.AbstractDirective,
    JarvesDirective: {
        name: 'jarvesField',
        options: {
            restrict: 'E',
            priority: -1,
            require: ['ngModel'],
            controller: ['$scope', '$element', '$attrs', '$parse', function($scope, $element, $attrs, $parse) {
                $element.jarvesField = new jarves.Directives.Field($scope, $element, $attrs);
                $element.jarvesField.setParse($parse);
                return $element.jarvesField;
            }],
            link: function(scope, element, attributes, ngModel) {
                element.jarvesField.link(scope, element, attributes, ngModel);
            }
        }
    },

    parse: null,

    setParse: function(parse) {
        this.parse = parse;
    },

    getParse: function() {
        return this.parse;
    },

    link: function(scope, element, attributes, ngModel) {
        if (!attributes.label) {
            attributes.noWrapper = true;
        }

        this.field = new jarves.Field(attributes, element[0], attributes.id);

        this.field.addEvent('change', function(value){
            scope.$apply(function() {
                this.getParse()(attributes.ngModel).assign(scope, value);
            }.bind(this))
        }.bind(this));

        scope.$watch(attributes.ngModel, function(){
            this.field.setValue(scope[attributes.ngModel]); //todo need $compile
        }.bind(this));
    }

});