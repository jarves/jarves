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

jarves.field_layoutElement = new Class({

    Implements: jarves.Base,

    initialize: function (pFieldObj) {

        this.fieldObj = pFieldObj;
        this.field = this.fieldObj.field;
        this.win = this.fieldObj.refs.win;

        //todo when we have in this.field the 'width' or 'height' then we dont make 'fullscreen'

        this.main = this.fieldObj.main;

        this.main.setStyle('position', 'absolute');
        this.main.setStyles({
            'left': 0,
            right: 0,
            'top': 0,
            bottom: 0
        });

        this.win.border.addEvent('click', function () {
            this.win.border.fireEvent('deselect-content-elements');
        }.bind(this));

        this.win.border.addEvent('deselect-content-elements', function () {
            this._deselectAllElements();
        }.bind(this));

        this.loadLayouts();

    },

    isEmpty: function () {
        var vals = this.getValue();
        if (Object.getLength(vals.layouts) == 0) {
            return true;
        }
        return false;
    },

    getValue: function () {

        var res = {template: this.select.value};
        var contents = this.layoutElement.getValue();
        if (contents) {
            res['contents'] = contents;
        }

        this.lastLayoutElementContents = res.contents;
        return res;
    },

    setValue: function (pValue) {

        var value = pValue;

        if (typeOf(pValue) == 'string') {
            var need = '{"contents":{';
            var need2 = '{"template":"';
            if (pValue.substr(0, need.length) == need || pValue.substr(0, need2.length) == need2) {
                value = JSON.decode(pValue);
            } else {
                value = {contents: {1: [
                    {type: 'text', 'content': pValue}
                ]}};
            }
        }

        if (value.template != this.select.value) {
            this.select.value = value.template;
            this.loadLayout();
        }
        this.lastLayoutElementContents = value.contents;
        this.layoutElement.setValue(value.contents);
    },

    loadLayouts: function () {

        this.mkTable(this.main).set('width', 260);
        this.mkTr();
        this.mkTd(_('Layout')).set('width', 80);
        var td = this.mkTd();

        this.select = new Element('select').addEvent('change', this.loadLayout.bind(this)).inject(td);

        Object.each(jarves.settings.configs, function (config, key) {

            if (config['themes']) {

                Object.each(config['themes'], function (options, themeTitle) {

                    if (options['layoutElement']) {

                        var group = new Element('optgroup', {
                            label: _(themeTitle)
                        }).inject(this.select);

                        $H(options['layoutElement']).each(function (templatefile, label) {
                            new Element('option', {
                                html: _(label),
                                value: templatefile
                            }).inject(group);
                        }.bind(this));

                    }

                }.bind(this));
            }
        }.bind(this));

        this.layoutContent = new Element('div', {
            'class': 'jarves-field-layoutelement-layoutcontent'
        }).inject(this.main);

        this.layoutToolbar = new Element('div', {
            'class': 'jarves-field-layoutelement-tinytoolbar'
        }).inject(this.main);

        this.loadLayout();

    },

    loadLayout: function () {
        var layout = this.select.value;

        if (this.layoutElement) {
            this.lastLayoutElementContents = this.layoutElement.getValue();
        }

        this.layoutElement = new jarves.LayoutElement(this.layoutContent, layout, this.win);

        if (this.lastLayoutElementContents) {
            this.layoutElement.setValue(this.lastLayoutElementContents);
        }

    },

    _deselectAllElements: function (pContent) {

        var selected = 0;

        if (!this.layoutElement) {
            return;
        }
        if (!this.layoutElement.layoutBoxes) {
            return;
        }

        Object.each(this.layoutElement.layoutBoxes, function (box, id) {
            box.deselectAll(pContent);
        });

    },

    getBaseUrl: function () {
        return _baseUrl;
    }






});