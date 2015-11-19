import {Directive} from '../angular.ts';
import {getPublicPath,eachValue} from '../utils.ts';
import angular from '../angular.ts';
import ListController from './ListController.ts';
import {getEntryPointPathForRelative} from '../utils.ts';
import WindowList from './WindowList.ts'

@Directive('windowCombined', {
    restrict: 'E',
    //templateUrl: 'bundles/jarves/views/window.combine.html',
    controllerAs: 'windowCombined'
})
export default class WindowCombined extends WindowList {
    public options = {};
    public classProperties;
    public error;

    public currentView = 1;
    public editView = 1;
    public selected;
    public switchToEditView;
    
    public editId;

    public unsavedDialogOldValue;
    public showUnsavedDialog;

    constructor(private $scope, private $element, private $attrs, private $q, private backend, private objectRepository, private jarves, private $timeout) {
        super($scope, $element, $attrs, $q, backend, objectRepository, jarves);

        console.log('init WindowCombined');
        this.jarves.loadEntryPointOptions(this.getEntryPoint()).success((response) => {
            this.classProperties = response.data;
        }).error((response) => {
            this.error = 'Failed to load entry point definition for %s'.sprintf(this.getEntryPoint());
        });

        $scope.$watch('windowCombined.selected', (value, oldValue) => {
            //if (!angular.equals(this.editId, value)) {
            //    console.log('selected change', this.$scope.forms.addForm, this.$scope.forms.addForm ? this.$scope.forms.addForm.getChangedData() : null);
            //    if (this.$scope.forms.addForm && this.$scope.forms.addForm.hasChanges()) {
            //        this.unsavedDialogOldValue = oldValue;
            //        this.showUnsavedDialog = true;
            //         //this.switchBackToEditView = 2;
            //        return;
            //    }
            //    if (this.$scope.forms.editForm && this.$scope.forms.editForm.hasChanges()) {
            //        this.unsavedDialogOldValue = oldValue;
            //        this.showUnsavedDialog = true;
            //         //this.switchBackToEditView = this.editView;
            //        return;
            //    }
            //}

            this.editId = value;

            if (this.switchToEditView) {
                this.editView = this.switchToEditView;
                this.switchToEditView = null;
            } else if (this.editId) {
                this.currentView = 2;
                this.editView = 1;
            }
        });
    }

    getEditForm(){
        return this.$scope.$eval($this.attribtues['formEdit']);
    }

    getAddForm(){
        return this.$scope.$eval($this.attribtues['formEdit']);
    }

    unsavedDialogStay() {
        this.selected = this.unsavedDialogOldValue;
        this.unsavedDialogOldValue = null;
        // this.editView = this.switchBackToEditView;
        this.showUnsavedDialog = false;
        // delete this.switchBackToEditView;
        this.switchToEditView = null;
    }

    unsaveDialogDiscard() {
        console.log('switch back to ', this.selected, this.switchToEditView, this.switchBackToEditView);
        this.editId = this.selected;
        this.unsavedDialogOldValue = null;
        this.showUnsavedDialog = false;

        if (this.switchToEditView) {
            this.editView = this.switchToEditView;
            this.switchToEditView = null;
        } else if (this.editId) {
            this.currentView = 2;
            this.editView = 1;
        }

    }

    edit(pk) {
        this.selected = pk;
    }

    remove(pk) {
        if (angular.equals(pk, this.selected)) {
            this.selected = null;
        }
    }

    showAdd() {
        this.currentView = 2;
        this.switchToEditView = 2;
        this.selected = null; //triggers $watch .selected and use if anything is good switchToEditView as new view
    }

    getEditEntryPoint() {
        return getEntryPointPathForRelative(this.getEntryPoint(), this.classProperties.editEntrypoint);
    }

    getAddEntryPoint() {
        return getEntryPointPathForRelative(this.getEntryPoint(), this.classProperties.addEntrypoint);
    }
}