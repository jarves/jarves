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

    addValue: function (pItem) {

        if (typeOf(pItem) == 'null') {
            return;
        }

        var span = new Element('span', {
            'class': 'jarves-textboxList-item'
        }).inject(this.title);

        this.getLabel(pItem, function (item) {

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
                    this.value.erase(pItem);
                    span.destroy();
                }.bind(this))
                .inject(span);

        }.bind(this));

        this.value.push(pItem);

    },

    checkIfCurrentValue: function (pItem, pA) {

        if (this.value.contains(pItem.key)) {
            pA.addClass('icon-checkmark-6');
            pA.addClass('jarves-select-chooser-item-selected');
        }
    },

    chooseItem: function (pItem, pInternal) {

        if (this.value.contains(pItem.key)) {
            return false;
        }

        this.addValue(pItem);

        if (pInternal) {
            this.fireChange();
        }
    },

    getValue: function () {
        return this.value;
    },

    setValue: function (pValue, pInternal) {

        this.clear();

        if (typeOf(pValue) == 'null') {
            return;
        }

        if (typeOf(pValue) != 'array') {
            pValue = [pValue];
        }

        Array.each(pValue, function (item) {
            this.addValue(item);
        }.bind(this));

        this.value = pValue;

        if (pInternal) {
            this.fireChange();
        }
    }

});
