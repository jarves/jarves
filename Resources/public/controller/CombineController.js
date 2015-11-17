import ListController from './ListController.js';
import {getEntryPointPathForRelative} from '../utils.ts';
import angular from '../angular.ts';

export default class CombineController extends ListController {

    constructor($scope, $element, $attrs, $q, backend, objectRepository, jarves, $timeout) {
        this.scope = $scope;
        this.scope.combineController = this;
        this.element = $element;
        this.backend = backend;
        this.objectRepository = objectRepository;
        this.q = $q;
        this.jarves = jarves;
        this.$timeout = $timeout;
        this.scope.listController = this;
        this.options = {};

        this.jarves.loadEntryPointOptions(this.getEntryPoint()).success((response) => {
            this.classProperties = response.data;
        }).error((response) => {
            this.error = 'Failed to load entry point definition for %s'.sprintf(this.getEntryPoint());
        });

        this.currentView = 1;
        this.editView = 1;
        this.selected = null;

        $scope.forms = {};

        $scope.$watch('combineController.selected', function(value, oldValue) {
            if (!angular.equals(this.editId, value)) {
                console.log('selected change', this.scope.forms.addForm, this.scope.forms.addForm ? this.scope.forms.addForm.getChangedData(): null);
                if (this.scope.forms.addForm && this.scope.forms.addForm.hasChanges()) {
                    this.unsavedDialogOldValue = oldValue;
                    this.showUnsavedDialog = true;
                    // this.switchBackToEditView = 2;
                    return;
                }
                if (this.scope.forms.editForm && this.scope.forms.editForm.hasChanges()) {
                    this.unsavedDialogOldValue = oldValue;
                    this.showUnsavedDialog = true;
                    // this.switchBackToEditView = this.editView;
                    return;
                }
            }

            this.editId = value;

            if (this.switchToEditView) {
                this.editView = this.switchToEditView;
                delete this.switchToEditView;
            } else if (this.editId) {
                this.currentView = 2;
                this.editView = 1;
            }
        }.bind(this));
    }


    unsavedDialogStay() {
        this.selected = this.unsavedDialogOldValue;
        delete this.unsavedDialogOldValue;
        // this.editView = this.switchBackToEditView;
        this.showUnsavedDialog = false;
        // delete this.switchBackToEditView;
        delete this.switchToEditView;
    }

    unsaveDialogDiscard() {
        console.log('switch back to ', this.selected, this.switchToEditView, this.switchBackToEditView);
        this.editId = this.selected;
        delete this.unsavedDialogOldValue;
        this.showUnsavedDialog = false;

        if (this.switchToEditView) {
            this.editView = this.switchToEditView;
            delete this.switchToEditView;
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