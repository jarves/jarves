jarves.Controller.WindowList = new Class({
    Statics: {
        $inject: ['$scope', '$element', '$attrs', '$http', '$q', 'windowService', 'jarves']
    },
    JarvesController: 'WindowList',

    itemsCount: 0,
    items: [],
    currentPage: 1,
    options: {},

    initialize: function($scope, $element, $attrs, $http, $q, windowService, jarves) {
        this.scope = $scope;
        this.scope.controller = this;
        this.element = $element;
        this.http = $http;
        this.q = $q;
        this.windowService = windowService;
        this.jarves = jarves;
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
    }

});