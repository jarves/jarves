jarves.Directives.Button = new Class({
    JarvesDirective: {
        name: 'button',
        options: {
            restrict: 'E',
            controller: true
        }
    },

    link: function(scope, element, attributes) {
        element.addClass('jarves-Button');
        if (attributes['pressed']) {
            scope.$watch(attributes['pressed'], function(pressed){
                if (pressed) {
                    element.addClass('jarves-Button-pressed');
                } else {
                    element.removeClass('jarves-Button-pressed');
                }
            });
        }
    }

});