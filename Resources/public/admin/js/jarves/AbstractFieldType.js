jarves.AbstractFieldType = new Class({

    Statics: {
        $inject: ['$scope', '$element', '$attrs', '$compile', '$parse', '$timeout', '$http', '$templateCache', '$q', '$interpolate']
    },

    $scope: null,
    $element: null,
    $attrs: null,
    $compile: null,
    $http: null,
    $templateCache: null,
    $q: null,
    $parse: null,
    $timeout: null,

    //valid: false,
    definition: null,
    options: {},

    fieldDirective: null,
    parentFieldDirective: null,

    children: [],
    form: null,

    optionsReferences: ['definition'],

    initialize: function() {
        var actualArguments = arguments;

        Array.each(this.Statics.$inject, function(name, index) {
            this[name] = actualArguments[index];
        }.bind(this));

        this.$scope.controller = this;

        this.optionsReferencesMap = {};
        Array.each(this.optionsReferences, function(item){
            this.optionsReferencesMap[item] = true;
        }, this);
        Array.each(this.additionalOptionsReferences, function(item){
            this.optionsReferencesMap[item] = true;
        }, this);

        this.destructorBound = function() {
            //$scope.$off('$destroy', this.destructorBound);
            this.destructor();
        }.bind(this);

        this.$scope.$on('$destroy', this.destructorBound);
    },

    destructor: function() {

    },

    /**
     * @param {jarves.Directives.JarvesForm} form
     */
    setForm: function(form) {
        this.form = form;
    },

    getId: function() {
        return this.getOption('id');
    },

    getModelName: function() {
        return this.getOption('model') ||  'model.' + this.getOption('id');
    },

    getParentModelName: function() {
        return '$parent.' + this.getModelName();
    },

    renderTemplateUrl: function(url, beforeCompile){
        var deferred = this.$q.defer();
        this.$http.get(url, {cache: this.$templateCache})
            .success(function(response){
                var element = angular.element(response);

                this.injectFieldElement(element);
                if (beforeCompile) {
                    beforeCompile(element);
                }
                this.$compile(element)(this.$scope);
                deferred.resolve();
            }.bind(this));
        return deferred.promise;
    },

    injectFieldElement: function(element) {
        if (this.fieldContainer) {
            this.fieldContainer.append(element);
        } else {
            this.$element.prepend(element);
        }
    },

    renderTemplate: function(element) {
        element = angular.element(element);
        this.injectFieldElement(element);
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
                this.definition = this.$scope.$parent.$eval(this.$attrs.definition) || {};
                if (this.definition.options) {
                    this.definition = Object.merge(this.definition, this.definition.options);
                }
            }
            if (this.definition && name in this.definition) {
                return this.options[name] = this.definition[name];
            }

            if (!this.$attrs[name]) {
                return null;
            }
            if (name in this.optionsReferencesMap) {
                return this.options[name] = this.$scope.$parent.$eval(this.$attrs[name]);
            } else {
                return this.options[name] = this.$interpolate(this.$attrs[name])(this.$scope.$parent);
            }
        }
    },

    isValid: function(highlight) {
        var valid = true;

        return valid;
    },

    setValue: function(value) {
        var modelName = this.getModelName();
        this.$timeout(function() {
            this.$parse(modelName).assign(this.$scope, value);
        }.bind(this));
    },

    setModelValue: function(modelName, value) {
        this.$timeout(function() {
            this.$parse(modelName).assign(this.$scope, value);
        }.bind(this));
    },

    getModelValue: function(modelName) {
        return this.$scope.$eval(modelName);
    },

    getValue: function() {
        var modelName = this.getModelName();
        return this.$scope.$eval(modelName);
    },

    //getModelName: function() {
    //    return this.getOption('model') || '$parent.model.' + this.getOption('id');
    //},

    getRelativeModelName: function(key) {
        var myModelName = this.getModelName();
        var parts = myModelName.split('.');
        parts.pop();

        return parts.join('.') + '.' + key;
    },

    link: function(scope, element, attributes) {
        if (this.getOption('noWrapper')) {
            return;
        }

        this.label = this.getOption('label');
        this.description = this.getOption('description') || this.getOption('desc');


        this.labelElement = angular.element('<div class="jarves-Field-title" ng-bind="controller.label"></div>');
        this.descElement = angular.element('<div class="jarves-Field-description" ng-if="controller.description" ng-bind="controller.description"></div>');

        this.fieldContainer = angular.element('<div class="jarves-Field-container"></div>');

        this.$element.prepend(this.descElement);
        this.$element.prepend(this.labelElement);
        this.labelElement.after(this.fieldContainer);

        this.$compile(this.descElement)(this.$scope);
        this.$compile(this.labelElement)(this.$scope);
        this.$compile(this.fieldContainer)(this.$scope);
    },

    save: function() {
        return true;
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