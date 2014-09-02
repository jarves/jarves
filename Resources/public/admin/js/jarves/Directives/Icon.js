jarves.Directives.Icon = new Class({

    JarvesDirective: {
        name: 'icon',
        options: {
            restrict: 'A',
            controller: true
        }
    },

    link: function(scope, element, attributes) {
        if (!attributes.icon) {
            return;
        }

        attributes.$observe('icon', function(value) {
            console.log('icon observe', element.attr('class'), value);
            if (this.oldClass) {
                element.removeClass(this.oldClass);
            }
            if (this.oldImg) {
                this.oldImg.destroy();
            }

            if ('#' === value.substr(0, 1)) {
                console.log('BAM', value.substr(1));
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