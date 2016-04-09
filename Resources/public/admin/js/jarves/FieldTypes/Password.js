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

jarves.FieldTypes.Password = new Class({
    Extends: jarves.FieldTypes.Text,

    Statics: {
        label: 'Password',
        asModel: true
    },

    createLayout: function () {
        this.parent();
        this.input.set('type', 'password');
    }
});