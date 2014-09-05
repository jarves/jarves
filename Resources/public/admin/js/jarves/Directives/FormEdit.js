jarves.Directives.FormEdit = new Class({
    Statics: {
        $inject: ['$scope', '$element', '$attrs', 'backend', '$q', 'windowService', 'jarves', 'objectRepository']
    },

    JarvesDirective: {
        name: 'formEdit',
        options: {
            restrict: 'E',
            scope: true,
            templateUrl: 'bundles/jarves/admin/js/views/form.edit.html',
            controller: true
        }
    },

    classProperties: null,
    pk: null,
    entryPoint: null,
    options: {},

    forms: {},

    noDataChanged: false,
    originalData: {},
    itemLoaded: false,

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
     */
    initialize: function($scope, $element, $attrs, backend, $q, windowService, jarvesServices, objectRepository) {
        this.scope = $scope;
        this.scope.model = {};
        this.scope.controller = this;
        this.element = $element;
        this.backend = backend;
        this.q = $q;
        this.windowService = windowService;
        this.jarves = jarvesServices;
        this.objectRepository = objectRepository;

        var parent = $scope.editController;
        $scope.editController = this;
        $scope.editController.$parentEditController = parent;

        if (instanceOf($scope.$parent.listController, jarves.Controller.CombineController)) {
            $scope.$parent.listController.setEditController(this);
        }
    },

    link: function(scope, element, attributes) {
        scope.$parent.$watchGroup([attributes.pk, attributes.entryPoint], function(values) {
            this.pk = values[0];
            this.entryPoint = values[1];

            console.log('changed windowEdit pk', this.pk, this.entryPoint);
            this.loadClassProperties();
        }.bind(this));
    },

    /**
     *
     * @param {String} name
     * @param {jarves.Directives.JarvesForm} form
     */
    addForm: function(name, form) {
        this.forms[name] = form;
    },

    getEntryPoint: function() {
        return this.entryPoint || this.scope.windowInfo.entryPoint.fullPath;
    },

    loadClassProperties: function() {
        if (this.lastLoadedClassPropertiesPath === this.getEntryPoint()) {
            this.loadData();
            return;
        }

        this.backend.post(this.getEntryPoint()+'/?_method=options')
            .success(function(response) {
                this.classProperties = response.data;
                this.loadData();
                this.lastLoadedClassPropertiesPath = this.getEntryPoint();
            }.bind(this))
            .error(function(response){
                this.error = response;
                throw response;
            }.bind(this));
    },

    getPrimaryKey: function() {
        return this.pk;
    },

    loadData: function() {
        var id = this.jarves.getObjectUrlId(this.getObjectKey(), this.getPrimaryKey());

        this.backend.get(this.getEntryPoint()+'/' + id)
            .success(function(response) {
                this.originalData = angular.copy(response.data);
                this.scope.model = response.data;
                this.itemLoaded = true;
            }.bind(this))
            .error(function(response){
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
        Object.each(this.forms, function(form) {
            if (!form.isValid(highlight)) {
                valid = false;
            }
        });

        return valid;
    },

    getObjectKey: function() {
        return this.classProperties['object'];
    },

    save: function() {
        this.noDataChanged = false;

        var data = this.getChangedData();
        var id = this.jarves.getObjectUrlId(this.getObjectKey(), this.originalData);

        this.backend.patch(this.getEntryPoint() + '/' + id, data)
            .success(this.handleSaveResponse.bind(this));
    },

    getChangedData: function() {
        var diff = {};

        Object.each(this.scope.model, function(value, key) {
            if (this.isDifferent(value, this.originalData[key])) {
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

    isDifferent: function(a, b) {
        var changed;
        if ('object' === typeOf(a)) {
            changed = false;
            if (Object.getLength(a) !== Object.getLength(b)) {
                return true;
            }

            Object.each(a, function(v, k) {
                if (changed) return false;
                changed = this.isDifferent(v, b[k]);
            }.bind(this));
            return changed;
        }

        if ('array' === typeOf(a)) {
            changed = false;
            if (a.length !== b.length) {
                return true;
            }
            Array.each(a, function(v, k) {
                if (changed) return false;
                changed = this.isDifferent(v, b[k]);
            }.bind(this));
            return changed;
        }

        return !angular.equals(a, b);
    },

    handleSaveResponse: function(response) {
        this.originalData = this.scope.model;
        if (true === response.data) {
            this.objectRepository.fireObjectChange(this.getObjectKey());
        } else if (false === response.data) {
            this.noDataChanged = true;
        } else if (response.error) {
            //todo, handle error stuff
        }
    }

});