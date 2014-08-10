jarves.Controller.WindowDefaultController = new Class({

    Statics: {
        $inject: ['$scope', '$element', '$attrs', 'windowService', 'jarves']
    },
    JarvesController: 'jarvesWindowDefaultController',
    template: 'bundles/jarves/admin/js/views/window.default.html',

    initialize: function($scope, $element, $attrs, windowService, jarves) {
        $scope.controller = this;
        console.log('new jarvesWindowDefaultController');
    }

});