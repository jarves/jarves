jarves.TextboxList = new Class({
    Extends: jarves.Select,

    value: [],

    options: {
        selectFirst: false
    },

    createLayout: function () {
        this.parent();
        this.box.addClass('jarves-TextboxList');
    },

    clear: function () {

        this.value = [];
        this.title.empty();

    },

    addValue: function (value) {

        if (typeOf(value) == 'null') {
            return;
        }

        var span = new Element('span', {
            'class': 'jarves-textboxList-item'
        }).inject(this.title);

        if ('object' === typeOf(value)) {
            value = jarves.getObjectId(this.options.object, value);
        }

        this.getLabel(value, function (item) {

            if (typeOf(item) != 'null' && item !== false) {
                span.set('html', this.renderLabel(item.label));
            }
            else {
                span.set('text', t('-- not found --'));
            }

            new Element('a', {
                href: 'javascript:;',
                html: '&#xe084;',
                title: t('Remove'),
                'class': 'jarves-textboxList-item-closer'
            })
                .addEvent('click', function (e) {
                    e.stopPropagation();
                    this.value.erase(value);
                    span.destroy();
                }.bind(this))
                .inject(span);

        }.bind(this));

        this.value.push(value);

    },

    checkIfCurrentValue: function (item, domAnchor) {

        if (this.value.contains(item.key)) {
            domAnchor.addClass('icon-checkmark-6');
            domAnchor.addClass('jarves-select-chooser-item-selected');
        }
    },

    chooseItem: function (item, internal) {

        if (this.value.contains(item.key)) {
            return false;
        }

        this.addValue(item);

        if (internal) {
            this.fireChange();
        }
    },

    getValue: function () {
        return this.value;
    },

    setValue: function (value, internal) {

        this.clear();

        if (typeOf(value) == 'null') {
            return;
        }

        if (typeOf(value) != 'array') {
            value = [value];
        }

        Array.each(value, function (item) {
            this.addValue(item);
        }.bind(this));

        this.value = value;

        if (internal) {
            this.fireChange();
        }
    }

});
