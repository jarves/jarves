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

jarves.FieldTypes.ContentTemplate = new Class({

    Extends: jarves.FieldTypes.Select,

    Statics: {
        label: 'Content Template',
        asModel: true
    },

    createLayout: function () {
        this.parent();

        Object.each(jarves.settings.configs, function(config, key) {
            if (config.themes) {
                Object.each(config.themes, function(theme){
                    var layouts = {};
                    if (theme.contents) {
                        Array.each(theme.contents, function(layout){
                            layouts[layout.file] = layout.label;
                        });
                    }

                    if (Object.getLength(layouts) > 0) {
                        this.select.addSplit(theme.label);
                        Object.each(layouts, function(label, id) {
                            this.select.add(id, label);
                        }.bind(this))
                    }
                }.bind(this))
            }
        }.bind(this));

        if (this.select.options.selectFirst) {
            this.select.selectFirst();
        }
    }
});