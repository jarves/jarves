jarves.AbstractFieldType = new Class({

    Statics: {
        $inject: ['$scope', '$element', '$attrs', '$compile', '$http', '$templateCache', '$q']
    },

    $scope: null,
    $element: null,
    $attrs: null,
    $compile: null,
    $http: null,
    $templateCache: null,
    $q: null,

    valid: false,
    definition: null,

    initialize: function($scope, $element, $attrs, $compile, $http, $templateCache, $q) {
        var actualArguments = arguments;

        Array.each(this.Statics.$inject, function(name, index) {
            this[name] = actualArguments[index];
        }.bind(this));

        if (this.$attrs.options) {
            this.$scope.$watch(this.$attrs['definition'], function(definition) {
                this.load(definition);
            }.bind(this));
        } else {
            this.load($attrs);
        }
    },

    renderTemplateUrl: function(url, beforeCompile){
        var deferred = this.$q.defer();
        this.$http.get(url, {cache: this.$templateCache})
            .success(function(response){
                this.$element.html(response);
                if (beforeCompile) {
                    beforeCompile(this.$element.contents());
                }
                this.$compile(this.$element.contents())(this.$scope);
                deferred.resolve();
            }.bind(this));
        return deferred.promise;
    },

    link: function(scope, element, attributes) {
        //
    },

    load: function(definition) {
        if (definition.type == this.JarvesDirective.fieldType) {
            this.valid = true;
            this.definition = definition;
        }
    },

    getDefinition: function() {
        return this.definition;
    },

    isValid: function() {
        return this.valid;
    }

});