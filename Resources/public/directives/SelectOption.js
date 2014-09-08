jarves.Directives.SelectOption = new Class({
    //Extends: jarves.AbstractFieldType,

    //Statics: {
    //    $inject: ['$scope', '$element', '$attrs', '$compile', '$http', '$templateCache', '$q']
    //},

    JarvesDirective: {
        name: 'option',
        options: {
            restrict: 'E',
            require: ['option', '?^jarvesSelectField'],
            controller: true
        }
    },

    link: function(scope, element, attributes, controllers) {
        var controller = controllers[1];
        if (controller) {
            var value = this.parseValues(element, attributes);
            controller.addOption(value);

            element.addClass('ng-hide');

            scope.$watch(function() {
                return element.text();
            }, function() {
                var oldValueId = value.id;
                value = this.parseValues(element, attributes);
                controller.setOption(oldValueId, value);
            }.bind(this));
        }
    },

    parseValues: function(element, attributes) {
        var label = element.text();
        var id = attributes.id ? attributes.$eval(attributes.id) : label;
        var icon = attributes.icon;

        return {
            label: label,
            id: id,
            icon: icon
        };
    }
});