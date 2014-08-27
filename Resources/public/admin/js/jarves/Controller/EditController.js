jarves.Controller.EditController = new Class({
    Statics: {
        $inject: ['$scope', '$element', '$attrs', '$http', '$q', 'windowService', 'jarves']
    },
    JarvesController: 'EditController',

    classProperties: null,
    pk: null,
    options: {},

    /**
     *
     * @param $scope
     * @param $element
     * @param $attrs
     * @param $http
     * @param $q
     * @param {jarves.Services.WindowService} windowService
     * @param {jarves.Services.Jarves} jarvesServices
     */
    initialize: function($scope, $element, $attrs, $http, $q, windowService, jarvesServices) {
        this.scope = $scope;
        this.scope.controller = this;
        this.element = $element;
        this.http = $http;
        this.q = $q;
        this.windowService = windowService;
        this.jarves = jarvesServices;

        if (instanceOf($scope.$parent.controller, jarves.Controller.CombineController)) {
            $scope.$parent.controller.setEditController(this);
            this.options.entryPoint = $scope.$parent.controller.getEditEntryPoint();
            this.pk = $scope.$parent.controller.getSelected();
        }

        this.loadClassProperties();
    },

    getEntryPoint: function() {
        return this.options.entryPoint || this.scope.windowInfo.entryPoint.fullPath;
    },

    loadClassProperties: function() {
        this.http.post(_pathAdmin + this.getEntryPoint()+'/?_method=options')
            .success(function(response) {
                this.classProperties = response.data;
                this.loadData();
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

        this.http.get(_pathAdmin + this.getEntryPoint()+'/' + id)
            .success(function(response) {
                this.scope.model = response.data;
            }.bind(this))
            .error(function(response){
                this.error = response;
                throw response;
            }.bind(this));
    }

});