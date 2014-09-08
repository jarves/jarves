jarves.Directives.JarvesFormGroup = new Class({
    Statics: {
        $inject: ['$scope', '$element', '$attrs', '$compile', '$interpolate']
    },
    JarvesDirective: {
        name: 'jarvesFormGroup',
        options: {
            restrict: 'E',
            scope: {
                'fields': '=',
                'model': '='
            },
            require: ['jarvesFormGroup'],
            controller: true
        }
    },

    fields: {},
    editController: null,

    initialize: function($scope, $element, $attributes, $compile, $interpolate) {
        this.$scope = $scope;
        this.$element = $element;
        this.$attributes = $attributes;
        this.$compile = $compile;
        this.$interpolate = $interpolate;
    },

    getName: function() {
        return this.$attributes.name ? this.$interpolate(this.$attributes.name)(this.$scope) : '';
    },

    isValid: function(highlight) {
        var valid = true;
        Object.each(this.fields, function(field) {
            if (!field.isValid(highlight)) {
                valid = false;
            }
        });

        return valid;
    },

    link: function(scope, element, attributes, controllers) {

        if (controllers[1]) {
            this.formController = controllers[1];

            if (this.formController) {
                this.formController.addFormGroup(this.getName(), this);
            }
        }

        this.$scope.$watch('fields', function(fields) {
            var xml = this.buildXml(fields, 'fields');
            this.$element.html(xml);
            this.$compile(this.$element.contents())(this.$scope);
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