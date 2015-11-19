import {isDifferent, each} from '../utils.ts';
import {Directive, Inject} from '../angular.ts';
import angular from '../angular.ts';

@Directive('jarvesForm', {
    restrict: 'E',
    scope: true,
    transclude: true,
    controllerAs: 'jarvesForm'
})
@Inject('$scope, $element, $attrs, backend, $q, jarves, objectRepository, $interpolate, $compile, $parse')
export default class JarvesForm {
    public pk = null;
    public entryPoint = null;
    public fields = [];

    /**
     * Is true when jarves-form is in save process.
     * @type {boolean}
     */
    public saving = false;

    protected optionsEntryPoint = '';
    protected noDataChanged = false;
    protected originalData = {};
    protected itemLoaded = false;

    protected options = {
        fields: null,
        object: null,
        objectKey: null
    };

    public error;

    protected template = '<jarves-form-group ng-if="jarvesForm.options.fields" fields="jarvesForm.options.fields" model="model"></jarves-form-group>';

    constructor(private $scope, private $element, private $attrs, private backend,
                private $q, private jarves, private objectRepository, private $interpolate, private $compile,
                private $parse
    ) {
        this.$scope.model = {};

        $scope.$on("$destroy", () => {
            if (this.getName()) {
                delete $scope.parentForms[this.getName()];
            }
        });
    }

    protected lastLoadedClassPropertiesPath;
    protected formGroup;
    protected name;

    link(scope, element, attributes, controllers, transclude) {
        scope.parentForms = scope.forms;

        transclude(scope, function(clone) {
            element.append(clone);
        });

        //if (this.getName()) {
        //    if (!scope.forms) {
        //        throw 'jarves-form has a name defined but is in no scope that provides a "forms" object.';
        //    }
        //    scope.parentForms[this.getName()] = this;
        //}
        //
        //scope.form = this;
        //
        //scope.forms = {};
        //this.forms = scope.forms;

        if ('bind' in attributes) {
            this.$parse(attributes.bind).assign(scope, this);
        }

        for (let [key, value] of each(this.options)) {
            if (this.$attrs[key]) {
                this.options[key] = this.$interpolate(this.$attrs[key])(this.$scope.$parent);
            }
        }

        scope.$parent.$watchGroup([attributes.pk, attributes.entryPoint, attributes.optionsEntryPoint], (values) => {
            this.pk = values[0];
            this.entryPoint = values[1];
            this.optionsEntryPoint = values[2];

            if (this.lastLoadedClassPropertiesPath !== this.optionsEntryPoint) {
                this.formGroup = angular.element(this.template);
                element.prepend(this.formGroup);
                this.$compile(this.formGroup)(scope);
                this.loadClassProperties(this.optionsEntryPoint);
            } else {
                if (this.entryPoint) {
                    this.loadData();
                }
            }
        });
    }

    getName() {
        if (!this.name && this.$attrs.name) {
            this.name = this.$interpolate(this.$attrs.name)(this.$scope);
        }

        return this.name;
    }

    /**
     *
     * @param {jarves.AbstractFieldType} field
     */
    addField(field) {
        this.fields.push(field)
    }

    getEntryPoint() {
        return this.entryPoint || this.$scope.windowInfo.entryPoint.fullPath;
    }

    loadClassProperties(optionsEntryPoint) {
        if (this.lastLoadedClassPropertiesPath === optionsEntryPoint) {
            this.loadData();
            return;
        }

        this.backend.post(optionsEntryPoint + '/?_method=options')
            .success((response) => {
                this.options = response.data;
                this.lastLoadedClassPropertiesPath = optionsEntryPoint;
                this.loadData();
            })
            .error((response) => {
                this.error = response;
                throw response;
            });
    }

    getPrimaryKey() {
        return this.pk;
    }

    loadData() {
        if (!this.pk) {
            this.originalData = angular.copy(this.$scope.model);
            return;
        }

        console.log('loadData', this.options);

        var id = this.jarves.getObjectUrlId(this.getObjectKey(), this.getPrimaryKey());

        this.backend.get(this.getEntryPoint() + '/' + id)
            .success((response) => {
                this.originalData = angular.copy(response.data);
                this.$scope.model = response.data;
                console.log('loaded', this.$scope.model);
                this.itemLoaded = true;
            })
            .error((response) => {
                this.error = response;
                throw response;
            });
    }

    /**
     *
     * @param {Boolean} [highlight]
     *
     * @returns {Boolean}
     */
    isValid(highlight) {
        var valid = true;
        for (let field of this.fields) {
            if (!field.isValid(highlight)) {
                valid = false;
            }
        }

        return valid;
    }

    getObjectKey() {
        var objectKey = this.options['object'] || this.options['objectKey'];

        if (!objectKey) {
            throw new Error('object-key or object not defined in <jarves-form> nor in options-entry-point="" result.');
        }

        return objectKey;
    }

    save() {
        this.noDataChanged = false;

        this.saving = true;

        this.callSave().then(() => {
            var data = this.getChangedData();
            var id = this.jarves.getObjectUrlId(this.getObjectKey(), this.originalData);

            this.backend.patch(this.getEntryPoint() + '/' + id, data)
                .success((response) => this.handleSaveResponse(response));
        });
    }

    add() {
        this.callSave().then(() => {
            var data = this.$scope.model;
            this.backend.post(this.getEntryPoint() + '/', data)
                .success((response) => this.handleSaveResponse(response));
        });
    }

    /**
     * Calls all save() methods at all our fields and sub forms.
     *
     * @return promise
     */
    callSave() {
        var deferred = this.$q.defer();

        var maxCount = this.fields.length, count = 0;

        function setDone(idx) {
            count++;
            deferred.notify({
                done: count,
                total: maxCount
            });
            if (count === maxCount) {
                deferred.resolve();
            }
        }

        for (let [idx, field] of each(this.fields)) {
            try {
                var promise = field.save();
                if (angular.isObject(promise) && promise.then) {
                    promise.then(function done(){
                        setDone(idx);
                    }, function error(message) {
                        deferred.reject(message);
                    });
                } else {
                    setDone(idx);
                }
            } catch (e) {
                deferred.reject();
                throw e;
            }
        }

        return deferred.promise;
    }

    getChangedData() {
        var diff = {};

        for (let [key, value] of each(this.$scope.model)) {
            if (isDifferent(value, this.originalData[key])) {
                diff[key] = value;
            }
        }

        return diff;
    }

    hasChanges() {
        var diff = this.getChangedData();
        console.log('haschanges', diff);
        return !angular.equals({}, diff);
    }

    handleSaveResponse(response) {
        this.saving = false;

        this.originalData = angular.copy(this.$scope.model);
        if (true === response.data) {
            this.objectRepository.fireObjectChange(this.getObjectKey());
        } else if (false === response.data) {
            this.noDataChanged = true;
        } else if (response.error) {
            //todo, handle error stuff
        }
    }

}