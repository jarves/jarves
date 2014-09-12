import ListController from './ListController';
import {getEntryPointPathForRelative} from '../utils';
import angular from '../angular';

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
                if (this.scope.forms.addForm && this.scope.forms.addForm.hasChanges()) {
                    this.showUnsagedDialog = true;
                    this.unsavedDialogOldValue = oldValue;
                    return;
                }
                if (this.scope.forms.editForm && this.scope.forms.editForm.hasChanges()) {
                    this.showUnsagedDialog = true;
                    this.unsavedDialogOldValue = oldValue;
                    return;
                }
            }

            this.editId = value;

            if (value) {
                this.currentView = 2;
                this.editView = 1;
            }
        }.bind(this));
    }

    stopUnsagedDialog() {
        this.selected = this.unsavedDialogOldValue;
        this.showUnsagedDialog = false;
        delete this.unsavedDialogOldValue;
    }

    continueUnsagedialog() {
        this.editId = this.selected;
        this.showUnsagedDialog = false;
        delete this.unsavedDialogOldValue;
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
        this.editView = 2;
        this.selected = null;
    }

    getEditEntryPoint() {
        return getEntryPointPathForRelative(this.getEntryPoint(), this.classProperties.editEntrypoint);
    }

    getAddEntryPoint() {
        return getEntryPointPathForRelative(this.getEntryPoint(), this.classProperties.addEntrypoint);
    }
}