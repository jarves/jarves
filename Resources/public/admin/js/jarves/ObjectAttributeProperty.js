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

jarves.ObjectAttributeProperty = new Class({

    Extends: jarves.FieldProperty,

    _createLayout: function(){
        this.parent();

        this.tdTargetObject = new Element('td').inject(this.main, 'top');
        this.iTargetObject = new jarves.Field({
            type: 'objectKey',
            options: {
                combobox: true
            },
            noWrapper: true
        }, this.tdTargetObject);
    },

    setValue: function (key, definition) {
        this.parent(key, definition);

        this.iTargetObject.setValue(definition ? definition.target : '');
    },

    getValue: function () {
        var value = this.parent();
        value.target = this.iTargetObject.getValue();

        return value;
    }

});