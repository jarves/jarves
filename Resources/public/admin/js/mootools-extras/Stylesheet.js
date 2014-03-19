/*
 ---

 name: Stylesheet
 description: js stylesheet
 license: MIT-Style License (http://mifjs.net/license.txt)
 copyright: Anton Samoylov (http://mifjs.net)
 authors: Anton Samoylov (http://mifjs.net)
 requires: JarvesBundle:1.2.4:*
 provides: Stylesheet

 ...
 */

var Stylesheet = new Class({

    version: '0.9',

    initialize: function () {
        this.createSheet();
        this.rules = {};
        this.styles = {};
        this.index = [];
        this.temp = new Element('div');
    },

    createSheet: function () {
        var style = new Element('style').inject(document.head);
        this.sheet = style.styleSheet || style.sheet;
    },

    addRule: function (selector, styles) {
        selector = selector.trim();
        if (selector.contains(',')) {
            var selectors = selector.split(',');
            selectors.each(function (selector) {
                this.addRule(selector, styles);
            }, this);
            return this;
        }
        var styles = (typeOf(styles) == 'string') ? styles : this.stylesToString(styles);
        if (!styles) {
            return;
        }
        var sheet = this.sheet;
        if (sheet.addRule) {
            sheet.addRule(selector, styles);
        } else {
            sheet.insertRule(selector + '{' + styles + '}', sheet.cssRules.length);
        }
        var rules = this.getRules();
        this.rules[selector] = rules.getLast();
        this.styles[selector] = styles;
        this.index.push(selector);
        return this;
    },

    addRules: function (rules) {
        for (selector in rules) {
            this.addRule(selector, rules[selector]);
        }
        return this;
    },

    stylesToString: function (styles) {
        this.temp.setStyles(styles);
        var string = this.temp.style.cssText;
        this.temp.style.cssText = '';
        return string;
    },

    removeRule: function (index) {
        var sheet = this.sheet;
        if (typeOf(index) == 'string') {
            var selector = index.trim();
            if (selector.contains(',')) {
                var selectors = selector.split(',');
                selectors.each(function (selector) {
                    this.removeRule(selector);
                }, this);
                return this;
            }
            var index = this.getRules().indexOf(this.getRule(selector));
            if (index < 0) {
                return this;
            }
        }
        sheet.removeRule ? sheet.removeRule(index) : sheet.deleteRule(index);
        var selector = this.index[index];
        this.index.erase(selector);
        delete this.rules[selector];
        delete this.styles[selector];
        return this;
    },

    getRule: function (selector) {
        return typeOf(selector) == 'string' ? this.rules[selector] : this.getRules()[selector];
    },

    getRules: function () {
        return Array.clone(this.sheet.cssRules || this.sheet.rules);
    }

});
