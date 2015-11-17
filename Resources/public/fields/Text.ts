import AbstractFieldType from './AbstractFieldType.ts';
import {Field, Directive, angular} from '../angular.ts';
import {each} from '../utils.ts';

@Field('text', {
    templateUrl: 'bundles/jarves/views/field.text.html',
    scope: {
        'placeholder': '@',
        'model': '='
    }
})
export default class Text extends AbstractFieldType {

    public static options:Object = {
        label: 'Text input',
        asModel: true,
        options: {
            modifier: {
                label: 'Value modifier',
                type: 'text',
                desc: 'A pipe separated list of modifiers. Example: trim|ucfirst|camelcase.' +
                'Possible: trim, lower, ucfirst, lcfirst, phpfunction, phpclass, underscore, camelcase, dash, url'
            },
            redirectSameValue: {
                label: 'Redirect this value',
                desc: 'Redirect this value to another field with the same result as this value. Example: fieldName:modifier1|modifier2,fieldName2:modifier3',
                type: 'text'
            },
            redirectValue: {
                label: 'Redirect this value always',
                desc: 'Redirect this value always to another field (and overwrites it always). Example: fieldName:modifier1|modifier2,fieldName2:modifier3',
                type: 'text'
            }
        }
    };

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
        var to = "aaaaaeeeeeiiiiooooouuuunc------";
        for (var i = 0, l = from.length; i < l; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }

        str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
            .replace(/\s+/g, '-') // collapse whitespace and replace by -
            .replace(/-+/g, '-'); // collapse dashes

        return str;
    }

    //constructor(...deps) {
    //    super(...deps);
    //    this.template = 'bundles/jarves/views/field.text.html';
    //    this.boundRedirects =  {}
    //}

    link(scope, element, attr, controller, transclude) {
        super.link(scope, element, attr, controller, transclude);
        //console.log('link Text.ts');
        //this.attr = attr;

        //this.renderTemplateUrl(
        //    this.template,
        //    this.beforeCompile.bind(this)
        //);

        this.setupRedirects();
        this.setupModifiers();
    }

    //static compile(element, attr) {
    ////    console.log('compile', element, attr);
    //    var contents = element.children();
    //    contents.attr('ng-model', this.getParentModelName());
    //}

    //beforeCompile(contents) {
    //    contents.attr('placeholder', this.attr.placeholder);
    //    contents.attr('translate', this.attr.translate);
    //    var width;
    //    if (width = this.getOption('width')) {
    //        contents.css('width', width);
    //    }
    //    contents.attr('ng-trim', false);
    //}

    setupModifiers() {
        if (this.getOption('modifier')) {
            this.$scope.$watch(this.getModelName(), function (value) {
                var newValue = this.applyModifier(value, this.getOption('modifier'));
                if (newValue !== value) {
                    this.setModelValue(newValue);
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
        value = angular.isString(value) ? value : '';
        var modifiers = modifierString.toLowerCase().split('|');

        for (let modifier of modifiers) {
            if (Text[modifier]) {
                value = Text[modifier](value);
            }
        }

        return value;
    }

    /**
     * @param {String} str
     * @returns {Object}
     */
    parseRedirects(str) {
        var redirects = {};
        for (let line of str.split(',')) {
            var splitted = line.split(':');
            redirects[splitted[0]] = splitted[1];
        }

        return redirects;
    }

    setupRedirects() {
        var redirects;

        if (this.getOption('redirectValue')) {
            redirects = this.parseRedirects(this.getOption('redirectValue'));

            for (let [key, modifiers] of each(redirects)) {
                if (!(key in this.boundRedirects)) {
                    this.bindRedirect(key, modifiers);
                }
            }
        }

        if (this.getOption('redirectSameValue')) {
            redirects = this.parseRedirects(this.getOption('redirectSameValue'));
            for (let [key, modifiers] of each(redirects)) {
                if (!(key in this.boundRedirects)) {
                    this.bindRedirect(key, modifiers, true);
                }
            }
        }
    }

    bindRedirect(targetModelName, modifier, onlySame = false) {

        this.$scope.$watch(this.getModelName(), function (value, oldValue) {
            var currentValue = this.getAnotherModelValue(this.getRelativeModelName(targetModelName)) || '';
            var convertedNew = this.applyModifier(value, modifier);
            var convertedOld = this.applyModifier(oldValue, modifier);
            // console.log('new change', this.getModelName(),' => ', this.getRelativeModelName(targetModelName), ':', value, '=>', convertedNew, '(', currentValue,')');

            if (onlySame) {
                if (convertedOld != currentValue) {
                    // console.log('not equal', convertedOld, currentValue);
                    return;
                }
            }

            this.setAnotherModelValue(this.getRelativeModelName(targetModelName), convertedNew);
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
}