jarves.ContentAbstract = new Class({
    Extends: jarves.FieldAbstract,

    /**
     * Destroys everything related to this contentType.
     */
    destroy: function(){

    },

    /**
     * Use this method to create your field layout.
     * Please do not use the constructor for this job.
     *
     * Inject your elements to this.fieldInstance.fieldPanel.
     */
    createLayout: function () {
        /* Override it to your needs */
    },

    selected: function() {
        //your field got selected
    },

    initInspector: function(inspectorContainer) {
        //the inspector has been opened
    },

    deselected: function() {
        //your field has been deselected
    },

    openInspectorOnAdd: function() {
        return false;
    },

    /**
     * Defines whether this type can be previewed.
     *
     * @returns {boolean}
     */
    isPreviewPossible: function() {
        return true;
    },

    /**
     * User pressed 'apply', we save the value from getValue() and the inspector is going to close after this call.
     */
    applyInspector: function() {

    },
    /**
     * User pressed 'cancel' or the dialog just disappeared without saving, so the inspector is going to close after this call.
     */
    cancelInspector: function() {

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
    }
});