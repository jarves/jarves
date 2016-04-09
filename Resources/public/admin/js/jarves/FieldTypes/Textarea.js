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

jarves.FieldTypes.Textarea = new Class({

    Extends: jarves.FieldTypes.Text,

    Statics: {
        asModel: true
    },

    options: {
        inputWidth: '100%',
        inputHeight: '50px'
    },

    createLayout: function () {
        this.wrapper = new Element('div', {
            style: this.options.style,
            'class': 'jarves-input-wrapper',
            styles: {
                'width': this.options.inputWidth == '100%' ? null : this.options.inputWidth
            }
        }).inject(this.fieldInstance.fieldPanel);

        this.input = new Element('textarea', {
            'class': 'jarves-Input-text',
            styles: {
                'width': '100%',
                'height': this.options.inputHeight
            }
        }).inject(this.wrapper);

        if ('auto' === this.options.inputHeight) {
            this.input.style.overflowY = 'hidden';
            this.input.addEvent('change', this.updateHeight.bind(this));
            this.input.addEvent('keydown', this.updateHeight.bind(this));
            this.input.addEvent('keyup', this.updateHeight.bind(this));
            this.updateHeight();
        }

        this.input.addEvent('change', this.checkChange);
        this.input.addEvent('keyup', this.checkChange);
    },

    updateHeight: function() {
        var scrollHeight = this.input.getScrollSize().y;
        var height = this.input.getSize().y;

        height = scrollHeight > height ? scrollHeight+5 : height;
        this.input.style.height = Math.max(height, 50) + 'px';
    },

    setValue: function(value, internal) {
        this.parent(value, internal);
        this.updateHeight();
    }
});