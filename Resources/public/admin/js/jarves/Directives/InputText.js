jarves.Directives.InputText = new Class({
    JarvesDirective: {
        name: 'jarvesText',
        options: {
            restrict: 'A',
            controller: true
        }
    },

    link: function(scope, element, attributes) {
        var allowedTypes = ['text', 'password'];
        if (!attributes.type || -1 !== allowedTypes.indexOf(attributes.type)) {
            element.addClass('jarves-Input-text');
        }
    }
});