jarves.ContentAbstract = new Class({
    Extends: jarves.FieldAbstract,

    /**
     * @returns {jarves.Editor}
     */
    getEditor: function() {
        return this.getContentInstance().getEditor();
    },

    /**
     * @returns {jarves.Slot}
     */
    getSlot: function() {
        return this.getContentInstance().getSlot();
    },

    /**
     * Destroys everything related to this contentType.
     */
    destroy: function(){

    },

    /**
     * Use this method to create your field layout.
     * Please do not the constructor for this job.
     *
     * Inject your elements to this.fieldInstance.fieldPanel.
     */
    createLayout: function () {
        /* Override it to your needs */
    },

    selected: function(inspectorContainer) {
        //your field got selected
    },

    deselected: function() {
        //your field got deselected
    },

    /**
     * @returns {jarves.Content}
     */
    getContentInstance: function () {
        return this.getParentInstance();
    },

    /**
     * @returns {jarves.FieldTypes.Content}
     */
    getContentFieldInstance: function () {
        return this.getEditor().getContentField();
    },

    /**
     * Defines whether this type can be previewed.
     *
     * @returns {boolean}
     */
    isPreviewPossible: function() {
        return true;
    }
});