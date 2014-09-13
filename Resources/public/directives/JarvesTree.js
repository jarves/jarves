import {Directive, Inject} from '../annotations';
import {each} from '../utils';
import angular from '../angular';

@Directive('jarvesTree', {
    restrict: 'E',
    scope: true,
    template: '<jarves-tree-item ng-repeat="item in items" item="item"></jarves-tree-item>'
})
@Inject('$scope, $element, $attrs, backend, $q, $parse, $compile, jarves, objectRepository')
export default class JarvesTree {
    constructor($scope, $element, $attrs, backend, $q, $parse, $compile, jarves, objectRepository) {
        this.$scope = $scope;
        this.$parse = $parse;
        this.$scope.treeController = this;
        this.$element = $element;
        this.backend = backend;
        this.$q = $q;
        this.$attrs = $attrs;
        this.$compile = $compile;
        this.jarves = jarves;
        this.objectRepository = objectRepository;

        this.classProperties = {};


        if ($attrs.entryPoint) {
            this.entryPoint = $scope.$parent.$eval($attrs.entryPoint);
        }

    }

    link() {

        this.$scope.items = [
                {
                    title: 'penis',
                    _childrenCount: 1,
                    _children: [
                        {title: 'penis sub'}
                    ]
                },
                {
                    title: 'Gazzo',
                    _children: [
                        {title: 'Gazzo sub'}
                    ]
                }
            ];

        for (let i = 0; i < 25; i++) {
            let item  = {
                title: 'dynamic #'+i,
                _children: []
            };
            for (let j = 0; j < 10; j++) {
                item._children.push({title: 'child #'+j})
            }

            this.$scope.items.push(item)
        }

        console.log('done, render now!');
    }

}

