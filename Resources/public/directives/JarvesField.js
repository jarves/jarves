jarves.Directives.JarvesField = new Class({
    Extends: jarves.Directives.AbstractDirective,

    Statics: {
        $inject: ['$scope', '$element', '$attrs', '$compile', '$http', '$templateCache', '$q']
    },
    JarvesDirective: {
        name: 'jarvesField',
        options: {
            restrict: 'E',
            priority: 5000,
            terminal: true,
            controller: true
        }
    },

    $scope: null,
    $element: null,
    $attrs: null,
    $compile: null,
    $http: null,
    $templateCache: null,
    $q: null,

    controller: null,

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
            this.load(attributes);
        }
    },

    load: function(definition) {
        if (!definition.type) {
            console.error(definition);
            throw 'no type';
        }
        this.$element.attr('jarves-%s-field'.sprintf(definition.type.lcfirst()), '');
        this.$compile(this.$element, null, 5000)(this.$scope);
    },

    /**
     *
     * @param {jarves.AbstractFieldType} controller
     */
    setController: function(controller){
        this.controller = controller;
    },

    /**
     * @returns {jarves.AbstractFieldType}
     */
    getController: function() {
        return this.controller;
    }

});