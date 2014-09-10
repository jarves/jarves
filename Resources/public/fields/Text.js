import AbstractFieldType from './AbstractFieldType';
import {Field} from '../annotations';

@Field('text')
export default class Text extends AbstractFieldType {

    static trimModifier(v) {
        return v.replace(/^\s+|\s+$/g, "");
    }

    static lowerModifier(v) {
        return v.toLowerCase();
    }

    static ucfirstModifier(v) {
        return v.length > 0 ? v.substr(0, 1).toUpperCase() + v.substr(1) : '';
    }

    static lcfirstModifier(v) {
        return v.length > 0 ? v.substr(0, 1).toLowerCase() + v.substr(1) : '';
    }

    static phpfunctionModifier(v) {
        return v.replace(/[^a-zA-Z0-9_]/g, '');
    }

    static phpclassModifier(v) {
        return v.replace(/[^\\a-zA-Z0-9_]/g, '');
    }

    static underscoreModifier(v) {
        return v.replace(/([^a-z]+)/g, function ($1) {
            return "_" + $1.toLowerCase().replace(/[^a-z]/g, '');
        });
    }

    static camelcaseModifier(v) {
        return v.replace(/([^a-zA-Z0-9]+[a-z])/g, function ($1) {
            return $1.toUpperCase().replace(/[^a-zA-Z0-9]/g, '');
        });
    }

    static dashModifier(v) {
        return v.replace(/([^a-zA-Z0-9]+)/g, function ($1) {
            return "-" + $1.toLowerCase().replace(/[^a-z]/g, '');
        });
    }

    static urlModifier(str) {
        str = str.replace(/ß/g, 'ss');
        str = str.replace(/^\s\s*/g, ' '); // trim
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

    //Statics: {
    //    label: 'Text input',
    //    asModel: true,
    //    options: {
    //        modifier: {
    //            label: 'Value modifier',
    //            type: 'text',
    //            desc: 'A pipe separated list of modifiers. Exampple: trim|ucfirst|camelcase.' +
    //            'Possible: trim, lower, ucfirst, lcfirst, phpfunction, phpclass, underscore, camelcase, dash, url'
    //        }
    //        redirectSameValue: {
    //            label: 'Redirect this value',
    //            desc: 'Redirect this value to another field with the same result as this value. Example: fieldName:modifier1|modifier2,fieldName2:modifier3',
    //            type: 'text'
    //        }
    //        redirectValue: {
    //            label: 'Redirect this value always',
    //            desc: 'Redirect this value always to another field (and overwrites it always). Example: fieldName:modifier1|modifier2,fieldName2:modifier3',
    //            type: 'text'
    //        }
    //    }
    //    modifiers: {
    //        'trim' (v) {
    //            return v.replace(/^\s+|\s+$/g, "");
    //        }
    //        'lower' (v) {
    //            return v.toLowerCase();
    //        }
    //
    //    }
    //},

    constructor(...deps) {
        this.template = 'bundles/jarves/views/field.text.html',
        this.boundRedirects =  {}
        super(...deps);
    }

    link(scope, element, attr) {
        super(scope, element, attr);
        this.attr = attr;

        this.renderTemplateUrl(
            this.template,
            this.beforeCompile.bind(this)
        );

        this.setupRedirects();
        this.setupModifiers();
    }

    setupModifiers() {
        if (this.getOption('modifier')) {
            this.$scope.$watch(this.getModelName(), function(value) {
                var newValue = this.applyModifier(value, this.getOption('modifier'));
                if (newValue !== value) {
                    this.setValue(newValue);
                }
            }.bind(this));
        }
    }

    /**
     * @param {String} value
     * @param {String} modifierString
     * @returns {String}
     */
    applyModifier(value, modifierString) {
        value = 'string' === typeOf(value) ? value : '';
        var modifiers = modifierString.toLowerCase().split('|');

        Array.each(modifiers, function (modifier) {
            if (Text[modifier]) {
                value = Text[modifier](value);
            }
        }.bind(this));

        return value;
    }

    /**
     * @param {String} str
     * @returns {Object}
     */
    parseRedirects(str) {
        var redirects = {};
        str.split(',').each(function(line) {
            var splitted = line.split(':');
            redirects[splitted[0]] = splitted[1];
        });

        return redirects;
    }

    setupRedirects() {
        var redirects;

        if (this.getOption('redirectValue')) {
            redirects = this.parseRedirects(this.getOption('redirectValue'));
            Object.each(redirects, function(modifiers, key) {
                if (!(key in this.boundRedirects)) {
                    this.bindRedirect(key, modifiers);
                }
            }.bind(this));
        }

        if (this.getOption('redirectSameValue')) {
            redirects = this.parseRedirects(this.getOption('redirectSameValue'));
            Object.each(redirects, function(modifiers, key) {
                if (!(key in this.boundRedirects)) {
                    this.bindRedirect(key, modifiers, true);
                }
            }.bind(this));
        }
    }

    bindRedirect(targetModelName, modifier, onlySame) {

        this.$scope.$watch(this.getModelName(), function(value, oldValue) {
            var currentValue = this.getModelValue(this.getRelativeModelName(targetModelName));
            var convertedNew = this.applyModifier(value, modifier);
            var convertedOld = this.applyModifier(oldValue, modifier);
            //console.log('new change', this.getModelName(),' => ', this.getRelativeModelName(targetModelName), ':', value, '=>', convertedNew, '(', currentValue,')');

            if (onlySame) {
                if (convertedOld != currentValue) {
                    return;
                }
            }

            this.setModelValue(this.getRelativeModelName(targetModelName), convertedNew);
        }.bind(this));

        //
        //
        //
        //
        //var doRedirect = function() {
        //    var result = this.applyModifier(this.getValue(), modifier);
        //    var resultBefore = this.applyModifier(this.oldValue, modifier);
        //    if (onlySame) {
        //        if (field.getValue() && resultBefore != field.getValue()) {
        //            return;
        //        }
        //    }
        //
        //    if (field.getValue() != result) {
        //        field.setValue(result, true);
        //    }
        //}.bind(this);
        //
        //if (field) {
        //    this.boundRedirects[key] = true;
        //    this.addEvent('change', doRedirect);
        //    doRedirect();
        //}
    }

    beforeCompile(contents) {
        contents.attr('placeholder', this.attr.placeholder);
        contents.attr('translate', this.attr.translate);
        contents.attr('ng-model', this.getParentModelName());
        var width;
        if (width = this.getOption('width')) {
            contents.css('width', width);
        }
        contents.attr('ng-trim', false);
    }
}