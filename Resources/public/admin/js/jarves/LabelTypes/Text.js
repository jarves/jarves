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

jarves.LabelTypes.Text = new Class({
    Extends: jarves.LabelAbstract,

    render: function(values) {
        var value = values[this.fieldId] || '';

//        var clazz = this.originField.type.charAt(0).toUpperCase() + this.originField.type.slice(1);
//        if ('Text' !== clazz && jarves.LabelTypes[clazz]) {
//            var obj = new jarves.LabelTypes[clazz](this.originField, this.definition, this.fieldId, this.objectKey);
//            return obj.render(values);
//        }

        return jarves.htmlEntities(value);
    }
});