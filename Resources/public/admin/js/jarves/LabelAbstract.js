jarves.LabelTypes = jarves.LabelTypes || {};

jarves.LabelAbstract = new Class({
    Implements: [Options, Events],

    definition: {},
    fieldId: '',
    objectKey: '',
    originField: {},

    options: {

    },

    initialize: function(originField, definition, fieldId, objectKey){
        this.originField = originField;
        this.definition = definition;
        this.setOptions(definition.options);
        this.fieldId = fieldId;
        this.objectKey = objectKey;
    },

    toElement: function() {
        return this.main;
    },

    render: function(values){
        return jarves.htmlEntities(values[this.fieldId]);
    },

    getObjectKey: function(){
        return this.objectKey;
    },

    getDefinition: function(){
        return this.definition;
    },

    setDefinition: function(definition){
        this.definition = definition;
    }
});