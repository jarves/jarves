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

jarves.FieldTypes.File = new Class({

    Extends: jarves.FieldTypes.Object,

    Statics: {
        asModel: true,
        options: {
            returnPath: {
                label: 'Return the path',
                description: 'Instead of the object id',
                type: 'checkbox',
                'default': false
            },
            onlyLocal: {
                label: 'Only local files',
                type: 'checkbox',
                'default': false
            },
            selectionOnlyFiles: {
                label: 'Only files are selectable',
                type: 'checkbox',
                'default': true
            },
            selectionOnlyFolders: {
                label: 'Only files are selectable',
                type: 'checkbox',
                'default': false
            }
        }
    },

    options: {
        returnPath: true,
        onlyLocal: false,
        selectionOnlyFiles: true,
        selectionOnlyFolders: false
    },

    initialize: function (pFieldInstance, pOptions) {
        pOptions.combobox = true;
        pOptions.browserOptions = {
            returnPath: this.options.returnPath,
            onlyLocal: this.options.onlyLocal,
            selectionOnlyFiles: this.options.selectionOnlyFiles,
            selectionOnlyFolders: this.options.selectionOnlyFolders
        };
        pOptions.objects = ['jarves/file'];

        this.parent(pFieldInstance, pOptions);
    }

});
