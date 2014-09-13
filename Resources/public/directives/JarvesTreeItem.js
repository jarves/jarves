import {Directive, Inject} from '../annotations';
import {each} from '../utils';
import angular from '../angular';

@Directive('jarvesTreeItem', {
    restrict: 'E',
    scope: true,
    require: ['^jarvesTree']
})
@Inject('$scope, $element, $attrs, backend, $q, $parse, $compile, jarves, objectRepository, $timeout')
export default class JarvesTreeItem {
    constructor($scope, $element, $attrs, backend, $q, $parse, $compile, jarves, objectRepository, $timeout) {
        this.$scope = $scope;
        this.$parse = $parse;
        this.$element = $element;
        this.backend = backend;
        this.$q = $q;
        this.$attrs = $attrs;
        this.$compile = $compile;
        this.jarves = jarves;
        this.objectRepository = objectRepository;
        this.$timeout = $timeout;
    }

    link(scope, element, attributes, jarvesTreeController) {

        this.jarvesTreeController = jarvesTreeController;
        this.parentJarvesTreeItemController = element.parent().controller('jarvesTreeItem');

        // console.log('parentDepth', scope, this.parentJarvesTreeItemController.getDepth());
        this.depth = this.parentJarvesTreeItemController ? this.parentJarvesTreeItemController.getDepth() + 1 : 1;

        if (!JarvesTreeItem.compiled) {
            console.log('need compile');
            var template = 
                '<div>{{item.title}}</div>'+
                '<div class="jarves-Tree-children">'+
                    '<jarves-tree-item ng-if="item._children" ng-repeat="subItem in item._children" item="subItem"></jarves-tree-item>'+
                '</div>';
            var contents = angular.element(template);
            JarvesTreeItem.compiled = this.$compile(contents);
        }

        JarvesTreeItem.compiled(scope, (clone) => {
            // angular.element(clone[1]).addClass('jarves-Tree-children-' + this.depth);
            element.append(clone);
        })

        scope.$parent.$watch(attributes.item, (item) => {
            scope.item = item;
        }, true);
    }

    static get compiled() {
        return JarvesTreeItem.compiled_;
    }

    static set compiled(compiled) {
        JarvesTreeItem.compiled_ = compiled;
    }

    getDepth() {
        return this.depth;
    }
}
