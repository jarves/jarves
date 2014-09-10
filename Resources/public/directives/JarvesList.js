import {Directive, Inject} from '../annotations';
import {each} from '../utils';
import angular from '../angular';

@Directive('jarvesList', {
    restrict: 'E',
    scope: true,
    // transclude: true,
    // templateUrl: 'bundles/jarves/views/list.html'
})
@Inject('$scope, $element, $attrs, backend, $q, $parse, $compile, jarves, objectRepository')
export default class JarvesList {
    constructor($scope, $element, $attrs, backend, $q, $parse, $compile, jarves, objectRepository) {
        this.$scope = $scope;
        this.$parse = $parse;
        this.$scope.controller = this;
        this.$element = $element;
        this.backend = backend;
        this.$q = $q;
        this.$attrs = $attrs;
        this.$compile = $compile;
        this.jarves = jarves;
        this.objectRepository = objectRepository;

        this.classProperties = {};
        this.selectedPk = null;
        this.selected = null;

        this.itemTemplateElement = null;

        this.template = '<jarves-list-item ng-repeat="item in controller.items" ng-class="{\'selected\': controller.isSelectedIndex($index)}"\
                         ng-click="controller.selectable && controller.selectIndex($index)"></jarves-list-item>';

        if ($attrs.entryPoint) {
            this.entryPoint = $scope.$parent.$eval($attrs.entryPoint);
        }

        if ($attrs.model) {
            this.selectable = true;

            $scope.$parent.$watch($attrs.model, (value) => {
                if ($attrs.entryPoint) {
                    this.selectedPk = value;
                } else {
                    this.selected = value;
                }
            });

            if ($attrs.entryPoint) {
                $scope.$watch('controller.selectedPk', (value) => {
                    this.$parse(this.$attrs.model).assign(this.$scope.$parent, value);
                });
            } else {
                $scope.$watch('controller.selected', (value) => {
                    this.$parse(this.$attrs.model).assign(this.$scope.$parent, value);
                });
            }
        }
    }

    link(scope, element, attributes, controller, transclude) {

        if (this.getEntryPoint()) {
            this.jarves.loadEntryPointOptions(this.getEntryPoint()).success((response) => {
                this.classProperties = response.data;
                if (this.classProperties.object && this.preSelect) {
                    this.select(this.preSelect);
                    delete this.preSelect;
                }
                this.renderTemplate();
                this.loadPage();
            });
        }

        if (attributes.items) {
            scope.$watch(attributes.items, (items) => {
                this.items = items;
            })
        }

        if (!this.getEntryPoint()) {
            this.renderTemplate();
        }
    }

    renderTemplate(){
        var template = angular.element(this.template);
        template.append(this.getItemTemplateElement());

        this.$compile(template)(this.$scope, (clone) => {
            this.$element.append(clone);
        });
    }

    setItemTemplateElement(itemTemplateElement) {
        this.itemTemplateElement = itemTemplateElement;
    }

    getItemTemplateElement() {
        if (!this.itemTemplateElement) {
            if (!this.getEntryPoint()) {
                throw '<jarves-list> does not contain a <jarves-list-template> element.';
            }

            if (!this.classProperties.columns) {
                throw '<jarves-list> entry-point has no columns defined.';
            }

            if (this.classProperties.itemLayout) {
                return angular.element(this.classProperties.itemLayout);
            } else {
                var titleNames = ['title', 'name', 'label'];
                var title;
                for (let titleName of titleNames) {
                    if (!title && titleName in this.classProperties.columns) {
                        title = titleName;
                    }
                }

                if (!title) {
                    for (let [k, v] of each(this.classProperties.columns)) {
                        title = k;
                        break;
                    }
                }

                if (title) {
                    return angular.element('<b>{{item.' + title + '}}</b>');
                }
            }
        }

        return this.itemTemplateElement;
    }
 
    getEntryPoint() {
        return this.entryPoint;
    }

    loadPage(page) {
        this.currentPage = page || 1;

        if (!this.itemsCount) {
            this.loadItemCount().then(() => {
                this.loadPage(page);
            });
            return;
        }

        var req = {};
        //this.ctrlPage.value = pPage;
        //
        req.offset = (this.classProperties.itemsPerPage * page) - this.classProperties.itemsPerPage;
        //req.lang = (this.languageSelect) ? this.languageSelect.getValue() : null;
        //
        req.withAcl = true;
        req.order = {};
        //req.order[this.sortField] = this.sortDirection;
        //if (this.actionBarSearchInput) {
        //    req.q = this.actionBarSearchInput.getValue();
        //}

        this.collection = this.objectRepository.newCollection(this.classProperties.object);
        this.collection.setOrder('title');
        this.collection.setEntryPoint(this.getEntryPoint());
        this.collection.setQueryOption('withAcl', true);
        //this.collection.setRepositoryMapping(this.classProperties.objectRepositoryMapping);
        this.collection.setSelection(this.getSelection());
        this.collection.change((items) => {
            this.items = items;
        });

        this.collection.load({
            offset: (this.classProperties.itemsPerPage * page) - this.classProperties.itemsPerPage,
            limit: this.classProperties.itemsPerPage
        });
    }

    getSelection() {
        var selection = [];

        for (let [id, column] of each(this.classProperties.columns)) {
            selection.push(id);
            if (column.selected) {
                for (let field of column.selected) {
                    if (-1 !== selection.indexOf(field)) {
                        selection.push(field);
                    }
                }
            }
        }
        return selection;
    }

    loadItemCount() {
        var deferred = this.$q.defer();
        var query = {};

        this.backend.get(this.getEntryPoint() + '/:count', query)
            .success((response) => {
                this.itemsCount = response.data;
                deferred.resolve();
            });

        return deferred.promise;
    }

    getSelected() {
        return this.selectedPk;
    }

    /**
    *
    * @param {Object} item
    */
    select(item) {
       if (!this.classProperties.object) {
           this.preSelect = item;
           return;
       }
    
       this.selectedPk = this.jarves.getObjectPk(this.classProperties.object, item);
    
       if (this.$attrs.model) {
           //var oldModelValue = this.$scope.$parent.$eval(this.$attrs.model);
           //console.log('compare', angular.equals(oldModelValue, this.selected), oldModelValue, this.selected);
           //if (!angular.equals(oldModelValue, this.selected)) {
           //    console.log('select grid', this.selected, this.$attrs.model);
               this.$parse(this.$attrs.model).assign(this.$scope.$parent, this.selected);
           //}
       }
    }

    // searchAndSetIndex() {
    //     if (!this.selectedPk) {
    //         this.selected = null;
    //         return;
    //     }
    //     if (this.getEntryPoint()) {
    //         for (let [index, item] of each(this.items)) {
    //             let pk = this.jarves.getObjectPk(this.classProperties.object, item);
    //             if (pk === this.selectedPk) {
    //                 this.selected = index;
    //                 return;
    //             }
    //         }
    //         this.selected = null;
    //     }
    // }

    selectIndex(index) {
        if (this.getEntryPoint()) {
            this.selectedPk = this.items[index] ? this.jarves.getObjectPk(this.classProperties.object, this.items[index]) : null;
        }
        this.selected = index;
    }

    isSelectedIndex(index) {
        if (this.selectedPk) {
            var pk = this.items[index] ? this.jarves.getObjectPk(this.classProperties.object, this.items[index]) : null;
            return angular.equals(this.selectedPk, pk);
        }

        return this.selected === index; //$root.jarves.compare(controller.selected, controller.getPk(item));
    }

    getPk(item) {
        return this.jarves.getObjectPk(this.classProperties.object, item);
    }
}