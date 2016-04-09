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

jarves.FieldTypes.Text = new Class({

    Extends: jarves.FieldAbstract,

    Binds: ['replace', 'checkChange', 'setupRedirects'],

    Statics: {
        label: 'Text input',
        asModel: true,
        options: {
            modifier: {
                label: 'Value modifier',
                type: 'text',
                desc: 'A pipe separated list of modifiers. Exampple: trim|ucfirst|camelcase.' +
                    'Possible: trim, lower, ucfirst, lcfirst, phpfunction, phpclass, underscore, camelcase, dash, url'
            },
            redirectSameValue: {
                label: t('Redirect this value'),
                desc: t('Redirect this value to another field with the same result as value. Example: fieldName:modifier1|modifier2,fieldName2:modifier3'),
                type: 'text'
            },
            redirectValue: {
                label: t('Redirect this value always'),
                desc: t('Redirect this value always to another field (and overwrites it always). Example: fieldName:modifier1|modifier2,fieldName2:modifier3'),
                type: 'text'
            }
        }
    },

    boundRedirects: {},

    options: {
        maxLength: 255,
        inputWidth: '100%',

        inputIcon: '',

        /**
         * Can be an array like
         *   ['regex', 'modifier' 'replacement']
         * to replace the content of the input after 'keyup' and 'change'.
         *
         * @type {Array}
         */
        replace: null,
        redirectSameValue: '',
        redirectValue: '',
        modifiers: {
            'trim': function (v) {
                return v.replace(/^\s+|\s+$/g, "");
            },
            'lower': function (v) {
                return v.toLowerCase();
            },
            'ucfirst': function (v) {
                return v.length > 0 ? v.substr(0, 1).toUpperCase() + v.substr(1) : '';
            },
            'lcfirst': function (v) {
                return v.length > 0 ? v.substr(0, 1).toLowerCase() + v.substr(1) : '';
            },
            'phpfunction': function (v) {
                return v.replace(/[^a-zA-Z0-9_]/g, '');
            },
            'phpclass': function (v) {
                return v.replace(/[^\\a-zA-Z0-9_]/g, '');
            },
            'underscore': function (v) {
                return v.replace(/([^a-z]+)/g, function ($1) {
                    return "_" + $1.toLowerCase().replace(/[^a-z]/g, '');
                });
            },
            'camelcase': function (v) {
                return v.replace(/([^a-zA-Z0-9]+[a-z])/g, function ($1) {
                    return $1.toUpperCase().replace(/[^a-zA-Z0-9]/g, '');
                });
            },
            'dash': function (v) {
                return v.replace(/([^a-zA-Z0-9]+)/g, function ($1) {
                    return "-" + $1.toLowerCase().replace(/[^a-z]/g, '');
                });
            },
            'url': function(str) {
                str = str.replace(/ß/g, 'ss');
                str = str.replace(/^\s+|\s+$/g, ''); // trim
                str = str.toLowerCase();

                // remove accents, swap ñ for n, etc
                var from = "ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;";
                var to   = "aaaaaeeeeeiiiiooooouuuunc------";
                for (var i=0, l=from.length ; i<l ; i++) {
                    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
                }

                str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
                    .replace(/\s+/g, '-') // collapse whitespace and replace by -
                    .replace(/-+/g, '-'); // collapse dashes

                return str;
            }
        }
    },

    /**
     * @internal
     * @type {String}
     */
    oldValue: null,

    createLayout: function () {
        this.main = this.input = new Element('input', {
            'class': 'jarves-Input-text',
            style: this.options.style,
            styles: {
                'width': this.options.inputWidth == '100%' ? null : this.options.inputWidth,
                'height': this.options.inputHeight ? parseInt(this.options.inputHeight) - 2 : null
            },
            maxLength: this.options.maxLength
        }).inject(this.fieldInstance.fieldPanel);

        if (this.options.disabled) {
            this.main.disabled = true;
        }

        if (this.options.inputIcon) {
            this.main = new Element('div', {
                'class': 'jarves-Input-text-container',
                styles: {
                    'width': this.options.inputWidth == '100%' ? null : this.options.inputWidth,
                    'height': this.options.inputHeight ? parseInt(this.options.inputHeight) - 2 : null
                }
            }).inject(this.fieldInstance.fieldPanel);
            this.input.inject(this.main);

            this.input.addClass('withIcon');

            if ('#' === this.options.inputIcon.substr(0, 1)) {
                new Element('span', {
                    'class': 'jarves-Input-text-icon ' + this.options.inputIcon.substr(1)
                }).inject(this.main);
            } else {
                new Element('img', {
                    'class': 'jarves-Input-text-icon',
                    src: jarves.mediaPath(this.options.inputIcon)
                }).inject(this.main);
            }
        }

        if (this.getFieldContainer()) {
            this.getFieldContainer().addEvent('ready', this.setupRedirects);
            this.getFieldContainer().addEvent('attachField', this.setupRedirects);
            this.setupRedirects();
        }

        this.input.addEvent('change', this.checkChange);
        this.input.addEvent('keyup', this.checkChange);
    },

    setupRedirects: function() {
        var redirects;

        if (this.options.redirectValue) {
            redirects = this.parseRedirects(this.options.redirectValue);
            Object.each(redirects, function(modifiers, key) {
                 if (!(key in this.boundRedirects)) {
                     this.bindRedirect(key, modifiers);
                 }
            }.bind(this));
        }

        if (this.options.redirectSameValue) {
            redirects = this.parseRedirects(this.options.redirectSameValue);
            Object.each(redirects, function(modifiers, key) {
                if (!(key in this.boundRedirects)) {
                    this.bindRedirect(key, modifiers, true);
                }
            }.bind(this));
        }
    },

    bindRedirect: function(key, modifier, onlySame) {
        var field = this.getFieldContainer().getField(key);

        var doRedirect = function() {
            var result = this.applyModifier(this.getValue(), modifier);
            var resultBefore = this.applyModifier(this.oldValue, modifier);
            if (onlySame) {
                if (field.getValue() && resultBefore != field.getValue()) {
                    return;
                }
            }

            if (field.getValue() != result) {
                field.setValue(result, true);
            }
        }.bind(this);

        if (field) {
            this.boundRedirects[key] = true;
            this.addEvent('change', doRedirect);
            doRedirect();
        }
    },

    /**
     * @param {String} str
     * @returns {Object}
     */
    parseRedirects: function(str) {
        var redirects = {};
        str.split(',').each(function(line) {
            var splitted = line.split(':');
            redirects[splitted[0]] = splitted[1];
        });

        return redirects;
    },


    toElement: function () {
        return this.input;
    },

    checkChange: function () {
        if (this.duringCheck) {
            return;
        }

        if (this.lastCheckChangeTimeout) {
            clearTimeout(this.lastCheckChangeTimeout);
        }
        this.lastCheckChangeTimeout = this._checkChange.delay(100, this);
    },

    _checkChange: function () {
        this.duringCheck = true;
        var range = null;

        try {
            range = this.input.getSelectedRange();
        } catch(e) {
        }

        if (typeOf(this.options.modifier) == 'string') {
            this.input.value = this.applyModifier(this.input.value, this.options.modifier);
        } else if (typeOf(this.options.modifier) == 'function') {
            this.input.value = this.options.modifier(this.input.value);
        }

        if (this.options.replace) {
            this.replace();
        }

        if (range && document.activeElement == this.input) {
            this.input.selectRange(range.start, range.end);
        }

        if (this.oldValue !== this.input.value) {
            this.fireChange();
            this.oldValue = this.input.value;
        }

        this.duringCheck = false;
    },

    /**
     * @param {String} value
     * @param {String} modifierString
     * @returns {String}
     */
    applyModifier: function(value, modifierString) {
        value = 'string' === typeOf(value) ? value : '';
        var modifiers = modifierString.toLowerCase().split('|');

        Array.each(modifiers, function (modifier) {
            if (this.options.modifiers[modifier]) {
                value = this.options.modifiers[modifier](value);
            }
        }.bind(this));

        return value;
    },

    replace: function () {
        var regEx = new RegExp(this.options.replace[0], this.options.replace[1]);
        var oldValue = this.input.value;
        this.input.value = oldValue.replace(regEx, this.options.replace[2]);
    },

    setDisabled: function (pDisabled) {
        this.input.disabled = pDisabled;
    },

    setValue: function (pValue) {
        if (typeOf(pValue) == 'null') {
            pValue = '';
        }
        if (typeOf(pValue) == 'object' || typeOf(pValue) == 'array') {
            pValue = JSON.encode(pValue);
        }
        this.oldValue = pValue;
        this.input.value = pValue;
        this._checkChange();
    },

    getValue: function () {
        return this.input.value;
    }

});