import {Inject} from '../angular.ts';

@Inject('$scope, $element, $attrs, $q, backend, objectRepository, jarves')
export default class ListController {
    constructor($scope, $element, $attrs, $q, backend, objectRepository, jarves) {
        this.scope = $scope;
        this.scope.listController = this;
        this.element = $element;
        this.backend = backend;
        this.objectRepository = objectRepository;
        this.q = $q;
        this.jarves = jarves;
        this.scope.listController = this;
        this.options = {};

        this.jarves.loadEntryPointOptions(this.getEntryPoint()).success(function(response) {
            this.classProperties = response.data;
        }.bind(this));
    }

    getEntryPoint() {
        return this.options.entryPoint || this.scope.windowInfo.entryPoint.fullPath;
    }

    select(pk) {
        console.log('select', pk);
        this.selected = pk;
    }

}