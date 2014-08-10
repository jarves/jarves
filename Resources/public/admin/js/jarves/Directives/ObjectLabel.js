jarves.Directives.ObjectLabel = new Class({
    JarvesDirective: {
        name: 'jarvesObjectLabel',
        options: {
            restrict: 'E',
            controller: ['$scope', '$element', '$attrs', 'jarves', function ($scope, $element, $attrs, jarvesService) {
                return new jarves.Directives.ObjectLabel($scope, $element, $attrs, jarvesService);
            }]
        }
    },

    object: null,
    data: null,
    column: null,
    id: null,

    initialize: function(scope, element, attributes, jarves) {
        this.scope = scope;
        this.element = element;
        this.jarves = jarves;

        Array.each(['object', 'id', 'column', 'data'], function(k){
            scope.$watch(attributes[k], function(value){
                this[k] = value;
                this.render();
            }.bind(this));
        }.bind(this));
    },

    render: function() {
        if (this.data && this.column && this.id && this.object) {
            var value = this.jarves.getObjectFieldLabel(this.data, this.column, this.id, this.object);
            this.element.html('');
            if ('element' === typeOf(value)) {
                this.element.append(value);
            } else {
                this.element.html(value);
            }
        }
    }
});