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
