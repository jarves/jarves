jarves.Directives.Icon = new Class({
    Extends: jarves.Directives.AbstractDirective,
    Statics: {
        $inject: ['$interpolate']
    },

    JarvesDirective: {
        name: 'layoutCell',
        options: {
            restrict: 'E',
            controller: true
            //transclude: true,
            //template: '<layout-cell-wrapper ng-transclude></layout-cell-wrapper>'
        }
    },

    link: function(scope, element, attributes) {
        if (attributes.width) {
            var width = this.$interpolate(attributes.width)(scope);
            if (width == parseInt(width)+'') {
                width += 'px';
            }
            element.css('width', width);
        }
    }

});