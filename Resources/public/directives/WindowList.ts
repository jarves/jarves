import {Directive} from '../angular.ts';
import {getPublicPath,eachValue} from '../utils.ts';
import angular from '../angular.ts';
import ListController from './ListController.ts';
import {getEntryPointPathForRelative} from '../utils.ts';
import JarvesWindow from './JarvesWindow.ts';

@Directive('windowList', {
    restrict: 'E',
    templateUrl: 'bundles/jarves/views/window.content.list.html',
    controllerAs: 'windowList',
    require: '^jarvesWindow'
})
export default class WindowList {
    public options = {};

    public selected;

    public classProperties:Object;
    public error:string;

    public jarvesWindow:JarvesWindow;

    constructor(private $scope, private $element, private $attrs, private $q, private backend, private objectRepository, private jarves) {
    }

    link(scope, element, attributes, controller) {
        this.jarvesWindow = controller;
        this.jarves.loadEntryPointOptions(this.getEntryPoint()).then((options) => {
            this.classProperties = options;
            this.postLink();
        }, (error) => {
            this.error = 'Failed to load entry point definition for %s'.sprintf(this.getEntryPoint());
        });
    }

    postLink() {

    }

    getEntryPoint() {
        if (this.jarvesWindow.getEntryPoint().object) {
            return 'jarves/object/' + this.jarvesWindow.getEntryPoint().object;
        }

        return this.jarvesWindow.getEntryPointPath();
    }

    select(pk) {
        console.log('select', pk);
        this.selected = pk;
    }

}