jarves.Controller.ListController = new Class({
    Statics: {
        $inject: ['$scope', '$element', '$attrs', '$http', '$q', 'windowService', 'jarves']
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
     * @param $http
     * @param $q
     * @param {jarves.Services.WindowService} windowService
     * @param {jarves.Services.Jarves} jarves
     */
    initialize: function($scope, $element, $attrs, $http, $q, windowService, jarves) {
        this.scope = $scope;
        this.scope.controller = this;
        this.element = $element;
        this.http = $http;
        this.q = $q;
        this.windowService = windowService;
        this.jarves = jarves;
        this.loadClassProperties();
    },

    loadClassProperties: function() {
        this.http.post(_pathAdmin + this.getEntryPoint()+'/?_method=options')
            .success(function(response) {
                this.classProperties = response.data;
                this.loadPage();
            }.bind(this))
            .error(function(response){
                this.error = response;
                throw response;
            }.bind(this));
    },

    getEntryPoint: function() {
        return this.options.entryPoint || this.scope.windowInfo.entryPoint.fullPath;
    },

    loadPage: function(page) {
        this.currentPage = page || 1;

        if (!this.itemsCount) {
            this.loadItemCount().then(function () {
                this.loadPage(page);
            }.bind(this));
            return;
        }

        var req = {};
        //this.ctrlPage.value = pPage;
        //
        req.offset = (this.classProperties.itemsPerPage * page) - this.classProperties.itemsPerPage;
        //req.lang = (this.languageSelect) ? this.languageSelect.getValue() : null;
        //
        req.withAcl = true;
        req.order = {};
        //req.order[this.sortField] = this.sortDirection;
        //if (this.actionBarSearchInput) {
        //    req.q = this.actionBarSearchInput.getValue();
        //}

        this.http.get(_pathAdmin + this.getEntryPoint() + '/', req)
            .success(function(response) {
                this.items = response.data;
            }.bind(this));
    },

    loadItemCount: function() {
        var deferred = this.q.defer();

        var query = {};

        this.http.get(_pathAdmin + this.getEntryPoint() + '/:count', query)
            .success(function(response){
                this.itemsCount = response.data;
                deferred.resolve();
            }.bind(this));

        return deferred.promise;
    },

    getSelected: function() {
        return this.selected;
    },

    /**
     *
     * @param {Object} item
     */
    select: function(item) {
        this.selected = this.jarves.getObjectPk(this.classProperties.object, item);
    },

    itemId: function(item) {
        return this.jarves.getObjectPk(this.classProperties.object, item);
    }
});