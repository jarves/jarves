jarves.Directives.JarvesLabel = new Class({

    Statics: {
        $inject: ['$scope', '$element', '$attrs', '$compile', '$interpolate', 'jarves']
    },

    JarvesDirective: {
        name: 'jarvesLabel',
        options: {
            restrict: 'E',
            priority: 5000,
            terminal: true,
            controller: true
        }
    },

    object: null,
    data: null,
    column: null,
    id: null,

    initialize: function() {
        var actualArguments = arguments;
        Array.each(this.Statics.$inject, function(name, index) {
            this[name] = actualArguments[index];
        }.bind(this));
    },

    link: function(scope, element, attributes) {
        if (this.$attrs.definition) {
            this.$scope.$watch(this.$attrs['definition'], function(definition) {
                this.load(definition);
            }.bind(this));
        } else {
            var definition = {};
            var interpolate = {'object': true, 'id': true, 'type': true};
            Object.each(attributes, function(value, key) {
                if (key in interpolate) {
                    definition[key] = this.$interpolate(value)(this.$scope);
                } else {
                    definition[key] = this.$scope.$eval(value);
                }
            }, this);
            this.load(definition);
        }
    },

    load: function(definition) {
        if (!definition.type) {
            console.error(definition);
            throw 'no type';
        }
        this.$element.attr('jarves-%s-label'.sprintf(definition.type.lcfirst()), '');
        this.$compile(this.$element, null, 5000)(this.$scope);
    }
});