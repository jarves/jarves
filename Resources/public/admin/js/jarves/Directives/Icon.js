jarves.Directives.Icon = new Class({

    JarvesDirective: {
        name: 'icon',
        options: ['$parse', function($parse) {
            return {
                restrict: 'A',
                link: function(scope, element, attrs) {
                    return new jarves.Directives.Icon(scope, element, attrs, $parse);
                }
            }
        }]
    },

    initialize: function(scope, element, attributes, $parse) {
        if (!attributes.icon) {
            return;
        }

        attributes.$observe('icon', function(value) {
            if (this.oldClass) {
                element.removeClass(this.oldClass);
            }
            if (this.oldImg) {
                this.oldImg.destroy();
            }

            if ('#' === value.substr(0, 1)) {
                element.addClass(value.substr(1));
                this.oldClass = value.substr(1);
            } else {
                this.oldImg = new Element('img', {
                    src: _path + value
                }).inject(element[0], 'top');
            }
        }.bind(this));

    }

});