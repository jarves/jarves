jarves.Controller.ListController = new Class({
    Statics: {
        $inject: ['$scope', '$element', '$attrs', '$q', 'backend', 'objectRepository', 'windowService', 'jarves']
    },
    JarvesController: 'ListController',

    classProperties: null,
    itemsCount: 0,
    items: [],
    currentPage: 1,
    options: {},

    /**
     *
     * @param $scope
     * @param $element
     * @param $attrs
     * @param $q
     * @param backend
     * @param {jarves.Services.ObjectRepository} objectRepository
     * @param {jarves.Services.WindowService} windowService
     * @param {jarves.Services.Jarves} jarves
     */
    initialize: function($scope, $element, $attrs, $q, backend, objectRepository, windowService, jarves) {
        this.scope = $scope;
        this.scope.controller = this;
        this.element = $element;
        this.backend = backend;
        this.objectRepository = objectRepository;
        this.q = $q;
        this.windowService = windowService;
        this.jarves = jarves;
        this.scope.listController = this;

        this.jarves.loadEntryPointOptions(this.getEntryPoint()).success(function(response) {
            this.classProperties = response.data;
        }.bind(this));

    },

    getEntryPoint: function() {
        return this.options.entryPoint || this.scope.windowInfo.entryPoint.fullPath;
    },

    select: function(pk) {
        console.log('select', pk);
        this.selected = pk;
    }

});