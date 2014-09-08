jarves.Directives.ThFixed = new Class({

    JarvesDirective: {
        name: 'fixed',
        options: ['$parse', function($parse) {
            return {
                restrict: 'A',
                priority: -100,
                link: function(scope, element, attrs) {
                    if ('tr' === element[0].tagName.toLowerCase()) {
                        return new jarves.Directives.ThFixed(scope, element, attrs, $parse);
                    }
                }
            }
        }]
    },

    initialize: function(scope, element, attributes, $parse) {

    }

});