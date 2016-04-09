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

jarves.LabelTypes.Select = new Class({
    Extends: jarves.LabelAbstract,

    render: function(values) {
        this.main = new Element('span');

        var options = Object.clone(this.options);
        options.noWrapper = true;
        options.type = 'select';
        options.transparent = true;
        options.disabled = true;

        this.field = new jarves.Field(options, this.main);

        var value = values[this.fieldId + '_' + this.definition.tableLabel] || values[this.fieldId + '__label'] || values[this.fieldId];
        this.field.setValue(value);

        document.id(this.field.getFieldObject()).removeClass('jarves-Select-disabled');
        document.id(this.field.getFieldObject()).getChildren('.jarves-Select-arrow').destroy();

        return this.main;
    }
});