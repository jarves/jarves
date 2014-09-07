jarves.Directives.JarvesForm = new Class({
    Statics: {
        $inject: ['$scope', '$element', '$attrs', 'backend', '$q', 'windowService', 'jarves', 'objectRepository', '$interpolate']
    },

    JarvesDirective: {
        name: 'jarvesForm',
        options: {
            restrict: 'E',
            scope: true,
            transclude: true,
            templateUrl: 'bundles/jarves/admin/js/views/form.html',
            controller: true
        }
    },

    pk: null,
    entryPoint: null,

    fields: [],

    optionsEntryPoint: '',
    noDataChanged: false,
    originalData: {},
    itemLoaded: false,

    options: {
        fields: null,
        object: null,
        objectKey: null
    },

    /**
     *
     * @param $scope
     * @param $element
     * @param $attrs
     * @param backend
     * @param $q
     * @param {jarves.Services.WindowService} windowService
     * @param {jarves.Services.Jarves} jarvesServices
     * @param {jarves.Services.ObjectRepository} objectRepository
     * @param $interpolate
     */
    initialize: function($scope, $element, $attrs, backend, $q, windowService, jarvesServices, objectRepository, $interpolate) {
        this.$scope = $scope;
        this.$scope.model = {title: 'empty', test: 'a'};
        this.$scope.controller = this;
        this.element = $element;
        this.backend = backend;
        this.$attrs = $attrs;
        this.$q = $q;
        this.windowService = windowService;
        this.jarves = jarvesServices;
        this.objectRepository = objectRepository;
        this.$interpolate = $interpolate;

        $scope.$on("$destroy", function() {
            if (this.getName()) {
                delete $scope.parentForms[this.getName()];
            }
        }.bind(this));
    },

    link: function(scope, element, attributes, controllers, transclude) {
        scope.parentForms = scope.forms;

        transclude(scope, function(clone) {
            element.append(clone);
        });

        if (this.getName()) {
            if (!scope.forms) {
                throw 'jarves-form has a name defined but is in no scope that provides a "forms" object.';
            }
            scope.parentForms[this.getName()] = this;
        }

        scope.form = this;

        scope.forms = {};
        this.forms = scope.forms;

        Object.each(Object.clone(this.options), function(value, key) {
            if (this.$attrs[key]) {
                this.options[key] = this.$interpolate(this.$attrs[key])(this.$scope.$parent);
            }
        }.bind(this));

        scope.$parent.$watchGroup([attributes.pk, attributes.entryPoint, attributes.optionsEntryPoint], function(values) {
            this.pk = values[0];
            this.entryPoint = values[1];
            this.optionsEntryPoint = values[2];

            if (this.optionsEntryPoint) {
                this.loadClassProperties(this.optionsEntryPoint);
            } else {
                if (this.entryPoint) {
                    this.loadData();
                }
            }
        }.bind(this));
    },

    getName: function() {
        if (!this.name && this.$attrs.name) {
            this.name = this.$interpolate(this.$attrs.name)(this.$scope);
        }

        return this.name;
    },

    /**
     *
     * @param {jarves.AbstractFieldType} field
     */
    addField: function(field) {
        this.fields.push(field)
    },

    getEntryPoint: function() {
        return this.entryPoint || this.$scope.windowInfo.entryPoint.fullPath;
    },

    loadClassProperties: function(optionsEntryPoint) {
        if (this.lastLoadedClassPropertiesPath === optionsEntryPoint) {
            this.loadData();
            return;
        }

        this.backend.post(optionsEntryPoint + '/?_method=options')
            .success(function(response) {
                this.options = response.data;
                console.log('options loaded from entry point');
                if (this.pk) {
                    this.loadData();
                }
                this.lastLoadedClassPropertiesPath = optionsEntryPoint;
            }.bind(this))
            .error(function(response) {
                this.error = response;
                throw response;
            }.bind(this));
    },

    getPrimaryKey: function() {
        return this.pk;
    },

    loadData: function() {
        console.log('loadData', this.options);

        var id = this.jarves.getObjectUrlId(this.getObjectKey(), this.getPrimaryKey());

        this.backend.get(this.getEntryPoint() + '/' + id)
            .success(function(response) {
                this.originalData = angular.copy(response.data);
                this.$scope.model = response.data;
                console.log('loaded', this.$scope.model);
                this.itemLoaded = true;
            }.bind(this))
            .error(function(response) {
                this.error = response;
                throw response;
            }.bind(this));
    },

    /**
     *
     * @param {Boolean} [highlight]
     *
     * @returns {Boolean}
     */
    isValid: function(highlight) {
        var valid = true;
        Array.each(this.fields, function(field) {
            if (!field.isValid(highlight)) {
                valid = false;
            }
        });

        return valid;
    },

    getObjectKey: function() {
        var objectKey = this.options['object'] || this.options['objectKey'];

        if (!objectKey) {
            throw new Error('object-key or object not defined in <jarves-form> nor in options-entry-point="" result.');
        }

        return objectKey;
    },

    save: function() {
        this.noDataChanged = false;

        this.callSave().then(function() {
            var data = this.getChangedData();
            var id = this.jarves.getObjectUrlId(this.getObjectKey(), this.originalData);

            this.backend.patch(this.getEntryPoint() + '/' + id, data)
                .success(this.handleSaveResponse.bind(this));
        }.bind(this));
    },

    add: function() {
        this.callSave().then(function() {
            var data = this.$scope.model;
            this.backend.post(this.getEntryPoint() + '/', data)
                .success(this.handleSaveResponse.bind(this));
        }.bind(this));
    },

    /**
     * Calls all save() methods at all our fields and sub forms.
     *
     * @return promise
     */
    callSave: function() {
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

        Array.each(this.fields, function(field, idx) {
            try {
                var promise = field.save();
                if ('object' === typeOf(promise) && promise.then) {
                    promise.then(function(){
                        setDone(idx);
                    }, function(message) {
                        deferred.reject(message);
                    });
                } else {
                    setDone(idx);
                }
            } catch (e) {
                deferred.reject();
                throw e;
            }
        });

        return deferred.promise;
    },

    getChangedData: function() {
        var diff = {};

        Object.each(this.$scope.model, function(value, key) {
            if (jarves.isDifferent(value, this.originalData[key])) {
                diff[key] = value;
            }
        }, this);

        return diff;
    },

    hasChanges: function() {
        if (!this.itemLoaded) {
            return false;
        }

        var diff = this.getChangedData();
        return 0 < Object.getLength(diff);
    },

    handleSaveResponse: function(response) {
        console.log('saved');
        this.originalData = angular.copy(this.$scope.model);
        if (true === response.data) {
            this.objectRepository.fireObjectChange(this.getObjectKey());
        } else if (false === response.data) {
            this.noDataChanged = true;
        } else if (response.error) {
            //todo, handle error stuff
        }
    }

});