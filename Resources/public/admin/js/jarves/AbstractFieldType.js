jarves.AbstractFieldType = new Class({

    Statics: {
        $inject: ['$scope', '$element', '$attrs', '$compile', '$http', '$templateCache', '$q']
    },

    //$scope: null,
    //$element: null,
    //$attrs: null,
    //$compile: null,
    //$http: null,
    //$templateCache: null,
    //$q: null,
    //
    //valid: false,
    definition: null,
    options: {},

    fieldDirective: null,
    parentFieldDirective: null,

    children: [],

    initialize: function($scope, $element, $attrs, $compile, $http, $templateCache, $q) {
        var actualArguments = arguments;

        this.destructorBound = function() {
            //$scope.$off('$destroy', this.destructorBound);
            this.destructor();
        }.bind(this);

        $scope.$on('$destroy', this.destructorBound);
        //
        Array.each(this.Statics.$inject, function(name, index) {
            this[name] = actualArguments[index];
        }.bind(this));

        //if (this.$attrs.options) {
        //    this.$scope.$watch(this.$attrs['definition'], function(definition) {
        //        this.setDefinition(definition);
        //    }.bind(this));
        //} else {
        //    this.setDefinition($attrs);
        //}
    },

    destructor: function() {
    }.protect(),

    renderTemplateUrl: function(url, beforeCompile){
        var deferred = this.$q.defer();
        this.$http.get(url, {cache: this.$templateCache})
            .success(function(response){
                var element = angular.element(response);

                this.$element.prepend(element);
                if (beforeCompile) {
                    beforeCompile(element);
                }
                this.$compile(element)(this.$scope);
                deferred.resolve();
            }.bind(this));
        return deferred.promise;
    },

    getOption: function(name) {
        if (this.options[name]) {
            return this.options[name];
        } else {
            if (null === this.definition) {
                this.definition = this.$scope.$eval(this.$attrs.definition) || {};
            }
            if (this.definition[name]) {
                return this.options[name] = this.definition[name];
            }
            if (this.$attrs[name]) {
                return this.options[name] = this.$scope.eval(this.$attrs[name]);
            }
        }
    },

    watchOption: function(name, cb) {
        if (this.$attrs.definition) {
            this.$scope.$watch(this.$attrs.definition, function(definition) {
                cb(definition[name]);
            });
        } else {
            this.$scope.$watch(this.$attrs[name], cb);
        }
    },

    link: function(scope, element, attributes) {
        //
    },

    /**
     *
     * @param {jarves.AbstractFieldType} child
     */
    addChildren: function(child) {
        this.children.push(child);
    },

    /**
     *
     * @param {jarves.Directives.JarvesField} controller
     */
    setFieldDirective: function(directiveController){
        this.fieldDirective = directiveController;
    },

    /**
     *
     * @param {jarves.Directives.JarvesField} directiveController
     */
    setParentFieldDirective: function(directiveController) {
        this.parentFieldDirective = directiveController;
        this.parentFieldDirective.getController().addChildren(this);
    },

    getParentController: function() {
        return this.parentFieldDirective.getController();
    }
});