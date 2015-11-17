import {Inject} from '../angular.ts';
import angular from '../angular.ts';

@Inject('$compile, $parse, $timeout, $http, $templateCache, $q, $interpolate')
export default class AbstractFieldType {

    public static options:Object = {};

    private options = {};
    private definition = {};
    private form;
    private children = [];
    private fieldDirective;
    private parentFieldDirective;
    private optionsReferences = ['definition'];
    private additionalOptionsReferences = [];
    private optionsReferencesMap = {};

    constructor(private $compile, private $parse, private $timeout, private $http, private $templateCache, private $q, private $interpolate) {
        for (let item of this.optionsReferences) {
            this.optionsReferencesMap[item] = true;
        }

        for (let item of this.additionalOptionsReferences) {
            this.optionsReferencesMap[item] = true;
        }
    }

    destructor():void {
    }

    /**
     * @param {jarves.Directives.JarvesForm} form
     */
    setForm(form) {
        this.form = form;
    }

    getId() {
        return this.getOption('id');
    }

    getModelName() {
        return this.getOption('model') || 'model.' + this.getOption('id');
    }

    getParentModelName() {
        return '$parent.' + this.getModelName();
    }

    renderTemplateUrl(url, beforeCompile) {
        var deferred = this.$q.defer();
        if (!url) {
            throw 'no template url defined';
        }
        this.$http.get(url, {cache: this.$templateCache})
            .success(function (response) {
                var element = angular.element(response);

                this.injectFieldElement(element);
                if (beforeCompile) {
                    beforeCompile(element);
                }
                this.$compile(element)(this.scope);
                deferred.resolve();
            }.bind(this));
        return deferred.promise;
    }

    injectFieldElement(element) {
        if (this.fieldContainer) {
            this.fieldContainer.append(element);
        } else {
            this.element.prepend(element);
        }
    }

    renderTemplate(element) {
        element = angular.element(element);
        this.injectFieldElement(element);
        this.$compile(element)(this.scope);
    }

    /**
     *
     * @param {String} name
     * @returns {*}
     */
    getOption(name) {
        if (this.options[name]) {
            return this.options[name];
        } else {
            if (null === this.definition && this.attributes.definition) {
                this.definition = this.scope.$parent.$eval(this.attributes.definition) || {};
                if (this.definition.options) {
                    this.definition = angular.extend(this.definition, this.definition.options);
                }
            }
            if (this.definition && name in this.definition) {
                return this.options[name] = this.definition[name];
            }

            if (!this.attributes[name]) {
                return null;
            }
            if (name in this.optionsReferencesMap) {
                return this.options[name] = this.scope.$parent.$eval(this.attributes[name]);
            } else {
                return this.options[name] = this.$interpolate(this.attributes[name])(this.scope.$parent);
            }
        }
    }

    isValid(highlight) {
        var valid = true;

        return valid;
    }

    setModelValue(value) {
        var modelName = this.getModelName();
        this.$parse(modelName).assign(this.scope.$parent, value);
    }

    onModelValueChange(cb) {
        this.scope.$parent.$watch(this.getModelName(), cb);
    }

    setAnotherModelValue(modelName, value) {
        // this.$timeout(function() {
        this.$parse(modelName).assign(this.scope.$parent, value);
        // }.bind(this));
    }

    getModelValue() {
        var modelName = this.getModelName();
        return this.scope.$parent.$eval(modelName);
    }

    getAnotherModelValue(modelName) {
        return this.scope.$parent.$eval(modelName);
    }

    // getModelName() {
    //    return this.getOption('model') || '$parent.model.' + this.getOption('id');
    // }

    getRelativeModelName(key) {
        var myModelName = this.getModelName();
        var parts = myModelName.split('.');
        parts.pop();

        var prefix = parts.join('.');

        return (prefix ? prefix + '.' : '') + key;
    }

    private scope:Object;
    private element:Element;
    private attributes:Object;

    private label:string;
    private description:string;
    private labelElement:Element;
    private descriptionElement:Element;
    private fieldContainer:Element;
    private childrenContainer:Element;
    private childrenContainer:Element;


    /**
     * Take care, this method can run several times.
     */
    link(scope, element, attributes, controller, transclude) {
        this.scope = scope;
        this.element = element;
        this.attributes = attributes;
        this.scope.fieldController = this;
        this.scope.$on('$destroy', () => this.destructor());

        //console.log('link AbstractFieldType.ts', this.getOption('inline') , element);

        if (this.getOption('inline') || 'inline' in this.attributes) {
            this.element.addClass('jarves-Field-no-wrapper');
            transclude(scope, (clone) => {
                element.append(clone);
            });
            return;
        }

        this.label = this.getOption('label');
        this.description = this.getOption('description') || this.getOption('desc');

        this.labelElement = angular.element('<div class="jarves-Field-title" ng-bind="fieldController.label"></div>');
        this.descriptionElement = angular.element('<div class="jarves-Field-description" ng-if="fieldController.description" ng-bind="fieldController.description"></div>');
        this.fieldContainer = angular.element('<div class="jarves-Field-container"></div>');
        this.childrenContainer = angular.element('<div class="jarves-Field-children"></div>');

        this.element.prepend(this.descriptionElement);
        this.element.prepend(this.labelElement);
        this.descriptionElement.after(this.fieldContainer);
        this.fieldContainer.after(this.childrenContainer);

        this.$compile(this.labelElement)(this.scope);
        this.$compile(this.descriptionElement)(this.scope);
        this.$compile(this.fieldContainer)(this.scope);
        this.$compile(this.childrenContainer)(this.scope);

        transclude(scope, (clone) => {
            this.childrenContainer.append(clone);
        });

        this.setDefaultValue();
    }

    setDefaultValue() {
        var defaultValue = this.getOption('default');
        if (defaultValue) {
            this.setModelValue(defaultValue);
        }
    }

    /**
     * Do some way to save not yet saved data. Propably uploading a file or something.
     * Return a promise if it should be asynchronouse.
     */
    save() {
        return true;
    }

    /**
     *
     * @param {jarves.AbstractFieldType} child
     */
    addChildren(child) {
        this.children.push(child);
    }

    /**
     *
     * @param {jarves.Directives.JarvesField} controller
     */
    setFieldDirective(directiveController) {
        this.fieldDirective = directiveController;
    }

    /**
     *
     * @param {jarves.Directives.JarvesField} directiveController
     */
    setParentFieldDirective(directiveController) {
        this.parentFieldDirective = directiveController;
        this.parentFieldDirective.getController().addChildren(this);
    }

    getParentController() {
        return this.parentFieldDirective.getController();
    }
}