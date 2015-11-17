import {Directive} from '../angular.ts';
import {getPublicPath,eachValue} from '../utils.ts';
import angular from '../angular.ts';
import ListController from './ListController.ts';
import {getEntryPointPathForRelative} from '../utils.ts';

@Directive('windowList', {
    restrict: 'E',
    templateUrl: 'bundles/jarves/views/window.content.list.html',
    controllerAs: 'windowList'
})
export default class WindowList {
    public options = {};

    public selected;

    constructor(private $scope, private $element, private $attrs, private $q, private backend, private objectRepository, private jarves) {
        this.jarves.loadEntryPointOptions(this.getEntryPoint()).success((response) => {
            this.classProperties = response.data;
        });
    }

    getEntryPoint() {
        return this.options.entryPoint || this.$scope.windowInfo.entryPoint.fullPath;
    }

    select(pk) {
        console.log('select', pk);
        this.selected = pk;
    }

}