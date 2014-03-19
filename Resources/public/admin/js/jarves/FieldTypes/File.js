jarves.FieldTypes.File = new Class({

    Extends: jarves.FieldTypes.Object,

    Statics: {
        asModel: true,
        options: {
            returnPath: {
                label: 'Return the path',
                desc: 'Instead of the object id',
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
