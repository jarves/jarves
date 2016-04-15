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

jarves.FieldTypes.ThemeOptions = new Class({

    Extends: jarves.FieldAbstract,

    createLayout: function() {
        new Element('div', {
            text: 'Hi'
        }).inject(this.getContainer());
    },

    themeAttached: false,
    value: {},
    optionsForm: null,

    setValue: function(value, internal, values) {
        if (!this.themeAttached) {
            var theme = this.getForm().getField('theme');
            theme.addEvent('change', function(themeId) {
                this.showThemeOptions(themeId);
            }.bind(this));
            this.themeAttached = true;
        }

        this.value = value;
        this.showThemeOptions(values.theme);
    },

    showThemeOptions: function(themeId) {
        var options = this.getThemeOptions(themeId);
        this.getContainer().empty();
        this.optionsForm = null;

        if (options) {
            this.optionsForm = new jarves.FieldForm(this.getContainer(), options);
            this.optionsForm.setValue(this.value);
        }
    },

    /**
     * @param {string} themeId
     * @returns {Object|null}
     */
    getThemeOptions: function(themeId) {
        var theme = jarves.getTheme(themeId);
        if (theme && theme.options) {
            return theme.options;
        }

        return null;
    },

    getValue: function() {
        return this.optionsForm ? this.optionsForm.getValue() : null;
    }

});