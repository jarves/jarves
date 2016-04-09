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

jarves.Checkbox = new Class({

    Implements: [Events],

    initialize: function (pContainer) {

        this.box = new Element('a', {
            'class': 'jarves-Checkbox jarves-Checkbox-off',
            href: 'javascript: ;'
        });

        new Element('div', {
            text: '|',
            'class': 'jarves-Checkbox-text-on'
        }).inject(this.box);

        new Element('div', {
            text: 'O',
            'class': 'jarves-Checkbox-text-off'
        }).inject(this.box);

        var knob = new Element('div', {
            'class': 'jarves-Checkbox-knob'
        }).inject(this.box);

        this.value = false;

        this.box.addEvent('click', function () {
            this.setValue(this.value == false ? true : false);
            this.fireEvent('change');
        }.bind(this));

        if (pContainer) {
            this.box.inject(pContainer);
        }
    },

    toElement: function () {
        return this.box;
    },

    getValue: function () {
        return this.value == false ? false : true;
    },

    setValue: function (p) {
        if (typeOf(p) == 'null') {
            p = false;
        }
        p = (!p || p == 'false') ? false : true;

        this.value = p;
        if (this.value) {
            this.box.removeClass('jarves-Checkbox-off');
            this.box.addClass('jarves-Checkbox-on');
        } else {
            this.box.addClass('jarves-Checkbox-off');
            this.box.removeClass('jarves-Checkbox-on');
        }
    }

});