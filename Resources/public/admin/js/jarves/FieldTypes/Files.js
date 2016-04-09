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

jarves.FieldTypes.Files = new Class({

    Extends: jarves.FieldTypes.Select,

    Statics: {
        asModel: true
    },

    initialize: function (pFieldInstance, pOptions) {

        pOptions.object = 'jarves/file';
        pOptions.objectBranch = pOptions.directory;
        pOptions.objectLabel = 'name';
        pOptions.labelTemplate = '{name}';

        this.parent(pFieldInstance, pOptions);
    }

});
