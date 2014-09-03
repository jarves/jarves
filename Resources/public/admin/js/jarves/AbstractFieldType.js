jarves.AbstractFieldType = new Class({

    Statics: {
        $inject: ['$scope', '$element', '$attrs', '$compile', '$http', '$templateCache', '$q', '$interpolate']
    },

    $scope: null,
    $element: null,
    $attrs: null,
    $compile: null,
    $http: null,
    $templateCache: null,
    $q: null,
    $parse: null,

    //valid: false,
    definition: null,
    options: {},

    fieldDirective: null,
    parentFieldDirective: null,

    children: [],

    initialize: function() {
        var actualArguments = arguments;

        Array.each(this.Statics.$inject, function(name, index) {
            this[name] = actualArguments[index];
        }.bind(this));

        this.interpolateMap = {};
        Array.each(this.interpolate, function(item){
            this.interpolateMap[item] = true;
        }, this);

        this.destructorBound = function() {
            //$scope.$off('$destroy', this.destructorBound);
            this.destructor();
        }.bind(this);

        this.$scope.$on('$destroy', this.destructorBound);
    },

    destructor: function() {

    },

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

    renderTemplate: function(element) {
        this.$element.prepend(element);
        this.$compile(element)(this.$scope);
    },

    /**
     *
     * @param {String} name
     * @returns {*}
     */
    getOption: function(name) {
        if (this.options[name]) {
            return this.options[name];
        } else {
            if (null === this.definition && this.$attrs.definition) {
                this.definition = this.$scope.$eval(this.$attrs.definition) || {};
            }
            if (this.definition && this.definition[name]) {
                return this.options[name] = this.definition[name];
            }

            if (name in this.interpolateMap) {
                return this.options[name] = this.$interpolate(this.$attrs[name])(this.$scope);
            } else {
                return this.options[name] = this.$scope.$eval(this.$attrs[name]);
            }
        }
    },

    watchOption: function(name, cb) {
        if (this.$attrs.definition) {
            this.$scope.$watch(this.$attrs.definition, function(definition) {
                cb(definition[name]);
            });
        } else {
            this.$attrs.$observe(name, cb);
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