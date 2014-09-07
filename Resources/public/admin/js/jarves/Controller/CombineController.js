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

        scope.$watch('controller.selected', function(value) {
            if (value) {
                //console.log('combine selected: ', this.selected);
                this.currentView = 2;
                this.editView = 1;
            }
        }.bind(this));
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