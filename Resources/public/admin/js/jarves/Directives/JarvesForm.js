jarves.Directives.JarvesForm = new Class({
    JarvesDirective: {
        name: 'jarvesForm',
        options: {
            restrict: 'E',
            scope: {
                'fields': '=',
                'model': '='
            },
            controller: ['$scope', '$element', '$attrs', '$compile', function ($scope, $element, $attrs, $compile) {
                return new jarves.Directives.JarvesForm($scope, $element, $attrs, $compile);
            }]
        }
    },

    initialize: function($scope, $element, $attributes, $compile) {

        $scope.$watch('fields', function(fields) {
            var xml = this.buildXml(fields, 'fields');
            $element.html(xml);
            $compile($element.contents())($scope);
        }.bind(this));
    },

    buildXml: function(fields, parentModelName, depth) {
        var xml = [];

        depth = depth || 0;

        var spacing = ' '.repeat(depth * 4);

        Object.each(fields, function(field, id) {
            field.id = field.id || id;

            var modelName = parentModelName + '.' + id;

            var line = spacing + '<jarves-field definition="%s">\n'.sprintf(modelName);
            if (field.children) {
                line += this.buildXml(field.children, modelName + '.children', depth + 1);
            }
            line += spacing + '</jarves-field>\n';
            xml.push(line);
        }.bind(this));

        return xml.join("\n");
    }
});