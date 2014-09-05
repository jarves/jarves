jarves.Controller.CombineController = new Class({
    Extends: jarves.Controller.ListController,
    JarvesController: 'CombineController',

    classProperties: {},
    currentView: 1,
    editView: 1,

    selected: null,
    formController: null,
    addController: null,

    initialize: function(scope) {
        scope.forms = {};
        this.parent.apply(this, arguments);
    },

    select: function(item) {
        this.currentView = 2;
        this.editView = 1;
        this.selected = this.jarves.getObjectPk(this.classProperties.object, item);
    },

    showAdd: function() {
        this.currentView = 2;
        this.editView = 2;
        this.selected = null;
    },

    getEditEntryPoint: function() {
        return jarves.getEntryPointPathForRelative(this.getEntryPoint(), this.classProperties.editEntrypoint);
    },

    getAddEntryPoint: function() {
        return jarves.getEntryPointPathForRelative(this.getEntryPoint(), this.classProperties.addEntrypoint);
    }

});