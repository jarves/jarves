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
        fullPath: false
    },

    module: '',
    path: '',

    initialize: function (pFieldInstance, pOptions) {

        pOptions.object = 'jarves/view';

        if (!pOptions.directory) {
            throw 'Option `directory` is empty in jarves.Field `view`.';
        }

        if (pOptions.directory.substr(0, 1) == '/') {
            pOptions.directory = pOptions.directory.substr(1);
        }

        if (pOptions.directory.substr(0, 1) == '@') {
            pOptions.directory = pOptions.directory.substr(1);
        }

        if (pOptions.directory.substr(pOptions.directory.length - 1, 1) != '/') {
            pOptions.directory += '/';
        }

        this.directory = pOptions.directory;

        pOptions.objectBranch = pOptions.directory ? pOptions.directory : true;
        this.parent(pFieldInstance, pOptions);
    },

    getValue: function () {
        var value = this.parent() || '';
        return this.options.fullPath ? value : value.substr(this.directory.length);
    },

    setValue: function (pValue) {
        if (pValue && !this.options.fullPath) {
            pValue = this.directory + pValue;
        }
        this.parent(pValue);
    }
});
