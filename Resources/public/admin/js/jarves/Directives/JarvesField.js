jarves.Directives.JarvesField = new Class({
    Extends: jarves.Directives.AbstractDirective,
    JarvesDirective: {
        name: 'jarvesField2',
        options: {
            restrict: 'E',
            priority: -1,
            controller: ['$scope', '$element', '$attrs', '$parse', function($scope, $element, $attrs, $parse) {
                $element.jarvesField = new jarves.Directives.JarvesField($scope, $element, $attrs);
                $element.jarvesField.setParse($parse);
                return $element.jarvesField;
            }],
            link: function(scope, element, attributes) {
                element.jarvesField.link(scope, element, attributes);
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

    link: function(scope, element, attributes) {
        this.scope = scope;
        this.element = element;
        this.attributes = attributes;

        if (attributes.options) {
            scope.$watch(attributes['definition'], function(definition) {
                this.render(definition);
            }.bind(this));
        } else {
            this.render(attributes);
        }
    },

    render: function(options) {
        if (!options.label) {
            options.noWrapper = true;
        }

        var modelName = options.ngModel || options.model;
        //
        //this.field = new jarves.Field(options, this.element[0], options.id || this.attributes.id);
        //
        //this.field.addEvent('change', function(value){
        //    this.scope.$apply(function() {
        //        this.getParse()(modelName).assign(scope, value);
        //    }.bind(this))
        //}.bind(this));
        //
        //this.scope.$watch(modelName, function(value){
        //    this.field.setValue(value);
        //}.bind(this));
    }

});