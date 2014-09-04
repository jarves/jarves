jarves.Directives.WindowEdit = new Class({
    Statics: {
        $inject: ['$scope', '$element', '$attrs', 'backend', '$q', 'windowService', 'jarves']
    },

    JarvesDirective: {
        name: 'windowEdit',
        options: {
            restrict: 'E',
            templateUrl: 'bundles/jarves/admin/js/views/window.content.edit.html',
            controller: true
        }
    },

    classProperties: null,
    pk: null,
    entryPoint: null,
    options: {},

    forms: {},

    /**
     *
     * @param $scope
     * @param $element
     * @param $attrs
     * @param backend
     * @param $q
     * @param {jarves.Services.WindowService} windowService
     * @param {jarves.Services.Jarves} jarvesServices
     */
    initialize: function($scope, $element, $attrs, backend, $q, windowService, jarvesServices) {
        this.scope = $scope;
        this.scope.controller = this;
        this.element = $element;
        this.backend = backend;
        this.q = $q;
        this.windowService = windowService;
        this.jarves = jarvesServices;

        var parent = $scope.editController;
        $scope.editController = this;
        $scope.editController.$parentEditController = parent;

        if (instanceOf($scope.listController, jarves.Controller.CombineController)) {
            $scope.listController.setEditController(this);
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
        var id = this.jarves.getObjectUrlId(this.classProperties['object'], this.getPrimaryKey());

        this.backend.get(this.getEntryPoint()+'/' + id)
            .success(function(response) {
                this.scope.model = response.data;
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

    save: function() {
        this.isValid(true);

    }

});