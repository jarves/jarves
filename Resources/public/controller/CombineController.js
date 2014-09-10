import ListController from './ListController';
import {getEntryPointPathForRelative} from '../utils'

export default class CombineController extends ListController {
    constructor($scope, ...deps) {
        this.currentView = 1;
        this.editView = 1;
        this.selected = null;

        super($scope, ...deps);
        $scope.forms = {};

        $scope.$watch('controller.selected', function(value) {
            if (value) {
                //console.log('combine selected: ', this.selected);
                this.currentView = 2;
                this.editView = 1;
            }
        }.bind(this));
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