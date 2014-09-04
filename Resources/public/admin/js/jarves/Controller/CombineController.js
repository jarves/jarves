jarves.Controller.CombineController = new Class({
    Extends: jarves.Controller.ListController,
    JarvesController: 'CombineController',

    editClassProperties: null,
    currentView: 1,

    editController: null,

    select: function(item) {
        this.currentView = 2;
        this.selected = this.jarves.getObjectPk(this.classProperties.object, item);
    },

    /**
     *
     * @param {jarves.Controller.EditController} controller
     */
    setEditController: function(controller) {
        this.editController = controller;
    },

    getEditEntryPoint: function() {
        return jarves.getEntryPointPathForRelative(this.getEntryPoint(), this.classProperties.editEntrypoint);
    }

});