import {Inject} from '../annotations';

@Inject('$scope, $element, $attrs, $q, backend, objectRepository, jarves')
export default class PageController {
    constructor($scope, $element, $attrs, $q, backend, objectRepository, jarves) {
        this.scope = $scope;
        this.scope.model = {};
        this.element = $element;
        this.backend = backend;
        this.objectRepository = objectRepository;
        this.q = $q;
        this.jarves = jarves;
    }

}