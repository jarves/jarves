import {Directive, Inject} from '../angular.ts';
import {each} from '../utils.ts';
import angular from '../angular.ts';

@Directive('jarvesTree', {
    restrict: 'E',
    scope: true,
    template: '<jarves-tree-item ng-repeat="item in items" item="item"></jarves-tree-item>'
})
@Inject('$scope, $element, $attrs, $interpolate, $q, $parse, $compile, jarves, objectRepository')
export default class JarvesTree {
    constructor($scope, $element, $attrs, $interpolate, $q, $parse, $compile, jarves, objectRepository) {
        this.$scope = $scope;
        this.$parse = $parse;
        this.$scope.treeController = this;
        this.$element = $element;
        this.$interpolate = $interpolate;
        this.$q = $q;
        this.$attrs = $attrs;
        this.$compile = $compile;
        this.jarves = jarves;
        this.objectRepository = objectRepository;
    }

    link(scope, element, attributes) {
        this.objectKey = attributes.object;

        if (attributes.entryPoint) {
            this.entryPoint = this.$interpolate(attributes.entryPoint)(scope);
        } else {
            this.entryPoint = 'object/' + this.objectKey;
        }

        this.loadRoots();
    }

    loadRoots() {

    }

        // this.$scope.items = [
        //         {
        //             title: 'penis',
        //             _childrenCount: 1,
        //             _children: [
        //                 {title: 'penis sub'}
        //             ]
        //         },
        //         {
        //             title: 'Gazzo',
        //             _children: [
        //                 {title: 'Gazzo sub'}
        //             ]
        //         }
        //     ];

        // for (let i = 0; i < 25; i++) {
        //     let item  = {
        //         title: 'dynamic #'+i,
        //         _children: []
        //     };
        //     for (let j = 0; j < 10; j++) {
        //         item._children.push({title: 'child #'+j})
        //     }

        //     this.$scope.items.push(item)
        // }

    visibleChildren(item) {
        //var pk = this.jarves.getObjectPk(this.objectKey, )

    }

}

