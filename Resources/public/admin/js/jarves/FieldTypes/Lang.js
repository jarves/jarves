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

jarves.FieldTypes.Lang = new Class({

    Extends: jarves.FieldTypes.Select,

    Statics: {
        asModel: true
    },

    initialize: function (fieldInstance, options) {
        options.object = 'jarves/language';
        this.parent(fieldInstance, options);

        var hasSessionLang = false;
        Object.each(jarves.settings.langs, function (lang, id) {

            if (id == window._session.lang) {
                hasSessionLang = true;
            }

        }.bind(this));

        if (hasSessionLang) {
            this.select.setValue(window._session.lang);
        }
    }

});