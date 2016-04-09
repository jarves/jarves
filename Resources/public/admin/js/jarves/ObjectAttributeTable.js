/*
 * This file is part of Jarves.
 *
 * (c) Marc J. Schmidt <marc@marcjschmidt.de>
 *
 *     J.A.R.V.E.S - Just A Rather Very Easy [content management] System.
 *
 *     http://jarves.io
 *
 * To get the full copyright and license information, please view the
 * LICENSE file, that was distributed with this source code.
 */

jarves.ObjectAttributeTable = new Class({
    Extends: jarves.FieldTable,

    _createLayout: function () {
        this.parent();

        new Element('th', {text: 'Target object'}).inject(this.headerTr, 'top');
        this.thKey.set('text', t('Attribute key'));
        this.thType.set('text', t('Attribute type'));
    },

    getValue: function () {
        var result = [];
        this.table.getChildren('tr.jarves-fieldProperty-item').each(function (item) {

            var fieldProperty = item.retrieve('jarves.FieldProperty');
            var value = fieldProperty.getValue();
            if (value && value.key && value.target) {
                var definition = Object.clone(value.definition);
                definition.target = value.target;
                definition.id = value.key;
                result.push(definition);
            }

        }.bind(this));

        return result;
    },

    setValue: function (value) {
        this.table.getChildren('tr').destroy();

        if (typeOf(value) == 'array') {
            Object.each(value, function (field) {
                this.add(field.id, field);
            }.bind(this));
        }
    },

    add: function (key, definition) {
        var fieldProperty = new jarves.ObjectAttributeProperty(key, definition, this.table, this.options, this.win);
        fieldProperty.addEvent('change', this.fireChange);

        this.fireEvent('add', fieldProperty);
        return fieldProperty;
    }

});