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

jarves.FieldTypes.View = new Class({

    Extends: jarves.FieldTypes.Select,

    Statics: {
        asModel: true,
        options: {
            directory: {
                label: 'Path to directory',
                type: 'text',
                desc: 'Example: @JarvesBundle/folder1/'
            },
            fullPath: {
                label: 'Full path',
                desc: 'Returns and uses the full path instead of the relative to the `directory` option.',
                type: 'checkbox'
            }
        }
    },

    options: {
        inputWidth: '100%',
        directory: '',
        fullPath: false,
        selectFirst: false,
        selectFirstOnNull: false
    },

    module: '',
    path: '',

    initialize: function (fieldInstance, options) {

        options.object = 'jarves/view';

        if (!options.directory) {
            throw 'Option `directory` is empty in jarves.Field `view`.';
        }

        if (options.directory.substr(0, 1) == '/') {
            options.directory = options.directory.substr(1);
        }

        if (options.directory.substr(0, 1) == '@') {
            options.directory = options.directory.substr(1);
        }

        if (options.directory.substr(options.directory.length - 1, 1) != '/') {
            options.directory += '/';
        }

        this.directory = options.directory;

        options.objectBranch = options.directory ? options.directory : true;
        this.parent(fieldInstance, options);
    },

    getValue: function () {
        var value = this.parent() || '';
        return this.options.fullPath ? value : value.substr(this.directory.length);
    },

    setValue: function (value) {
        if (value && !this.options.fullPath) {
            value = this.directory + value;
        }
        this.parent(value);
    }
});
