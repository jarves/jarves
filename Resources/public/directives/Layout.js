jarves.Directives.Layout = new Class({

    Statics: {
        $inject: ['$scope', '$element', '$attrs']
    },
    JarvesDirective: {
        name: 'jarvesLayout',
        options: {
            restrict: 'E'
        }
    },

    initialize: function(scope, element, attributes) {
        console.log('new layout', scope, element);
    }

});