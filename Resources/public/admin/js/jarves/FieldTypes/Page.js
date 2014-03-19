jarves.FieldTypes.Page = new Class({

    Extends: jarves.FieldTypes.Object,

    Statics: {
        asModel: true
    },

    initialize: function (pFieldInstance, pOptions) {
        pOptions.objects = ['JarvesBundle:node'];

        this.parent(pFieldInstance, pOptions);
    }

});
