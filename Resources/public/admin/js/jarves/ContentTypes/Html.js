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

jarves.ContentTypes = jarves.ContentTypes || {};

jarves.ContentTypes.Html = new Class({

    Extends: jarves.ContentAbstract,
    Binds: ['applyValue'],

    Statics: {
        icon: 'icon-html5',
        label: 'HTML'
    },

    options: {

    },

    createLayout: function() {
    },

    initInspector: function(inspectorContainer) {
        this.oldValue = this.value;
        this.input = new jarves.Field({
            noWrapper: true,
            type: 'codemirror',
            onChange: function(value) {
                this.value = value;
                this.renderValue();
            }.bind(this)
        }, inspectorContainer);

        this.input.setValue(this.value);
    },

    renderValue: function() {
        this.getContentInstance().getContentContainer().set('html', this.value);
    },

    isPreviewPossible: function() {
        return false;
    },

    openInspectorOnAdd: function() {
        return true;
    },

    setValue: function(value) {
        this.value = value;
        if (this.input) {
            this.input.setValue(value);
        }
        this.renderValue();
    },

    getValue: function() {
        return this.value;
    }
});
