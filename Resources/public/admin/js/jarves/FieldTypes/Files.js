jarves.FieldTypes.Files = new Class({

    Extends: jarves.FieldTypes.Select,

    Statics: {
        asModel: true
    },

    initialize: function (pFieldInstance, pOptions) {

        pOptions.object = 'JarvesBundle:File';
        pOptions.objectBranch = pOptions.directory;
        pOptions.objectLabel = 'name';
        pOptions.labelTemplate = '{name}';

        this.parent(pFieldInstance, pOptions);
    }

});
