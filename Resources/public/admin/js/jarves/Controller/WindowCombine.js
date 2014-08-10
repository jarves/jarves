jarves.Controller.WindowCombine = new Class({
    Extends: jarves.Controller.WindowList,
    Statics: {
        $inject: ['$scope', '$element', '$attrs', '$http', '$q', 'windowService', 'jarves']
    },
    JarvesController: 'WindowCombine',

    classProperties: null,
    currentView: 1,

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
        this.http.post(_pathAdmin + this.scope.windowInfo.entryPoint.fullPath+'/?_method=options')
            .success(function(response) {
                this.classProperties = response.data;
                this.loadPage();
            }.bind(this))
            .error(function(response){
                throw response;
            });
    }
});