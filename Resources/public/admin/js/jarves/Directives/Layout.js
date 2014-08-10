jarves.Directives.Layout = new Class({

    Statics: {
        $inject: ['$scope', '$element', '$attrs']
    },
    JarvesDirective: {
        name: 'jarvesLayout',
        options: {
            restrict: 'E',
            controller: jarves.Directives.Layout
        }
    },

    initialize: function(scope, element, attributes) {
        console.log('new layout', scope, element);
    }

});