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

jarves.FieldTypes.Info = new Class({

    Extends: jarves.FieldAbstract,

    container: null,

    Statics: {
        options: {
            html: {
                label: 'Safe info',
                description: t('Sets the value as `html` if true'),
                'default': false,
                type: 'checkbox'
            }
        }
    },

    createLayout: function () {
        this.infoLabel = new Element('div', {
            'class': 'jarves-Field-info'
        }).inject(this.getContainer());
    },

    setValue: function (pValue) {
        this.infoLabel.empty();
        if (!['string', 'number'].contains(typeOf(pValue))) {
            return;
        }

        this.infoLabel.set(this.options.html ? 'html' : 'text', pValue);
    },

    getValue: function () {
        return this.infoLabel.get(this.options.html ? 'html' : 'text');
    }
});
