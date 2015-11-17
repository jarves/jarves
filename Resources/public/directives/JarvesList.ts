import {Directive, Inject} from '../angular.ts';
import {each} from '../utils.ts';
import angular from '../angular.ts';

@Directive('jarvesList', {
    restrict: 'E',
    scope: true,
    controllerAs: 'jarvesList'
    // transclude: true,
    // templateUrl: 'bundles/jarves/views/list.html'
})
@Inject('$scope, $element, $attrs, backend, $q, $parse, $compile, jarves, objectRepository')
export default class JarvesList {
    public classProperties = {};
    public selectedPk;
    public selected;
    public itemTemplateElement;
    public template;

    public entryPoint;
    public selectable;

    protected preSelect;

    public items;

    constructor(private $scope, private $element, private $attrs, private backend, private $q, private $parse, private $compile, private jarves, private objectRepository) {
        this.classProperties = {};
        this.selectedPk = null;
        this.selected = null;

        this.itemTemplateElement = null;

        this.template = '<jarves-list-item ng-repeat="item in jarvesList.items" ng-class="{\'selected\': jarvesList.isSelectedIndex($index)}"\
                         ng-click="jarvesList.selectable && jarvesList.selectIndex($index)"></jarves-list-item>';

        if ($attrs.entryPoint) {
            this.entryPoint = $scope.$parent.$eval($attrs.entryPoint);
        }

        if ($attrs.model) {
            this.selectable = true;

            $scope.$parent.$watch($attrs.model, (value) => {
                if ($attrs.entryPoint) {
                    this.selectedPk = value;
                    this.searchAndSetIndex();
                } else {
                    this.selected = value;
                }
            });

            if ($attrs.entryPoint) {
                $scope.$watch('jarvesList.selectedPk', (value) => {
                    this.$parse(this.$attrs.model).assign(this.$scope.$parent, value);
                });
            } else {
                $scope.$watch('jarvesList.selected', (value) => {
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
                throw '<jarves-list> does not contain a <jarves-list-template> element nor e entry-point defined.';
            }

            var objectDefinition = this.jarves.getObjectDefinition(this.classProperties.object);
            if (objectDefinition.labelField) {
                return angular.element('<b>{{item.' + objectDefinition.labelField + '}}');
            }

            if (!this.classProperties.columns) {
                throw '<jarves-list>\' entry-point with object %s has no columns nor a label field defined.'.sprintf(this.classProperties.object);
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
           this.$parse(this.$attrs.model).assign(this.$scope.$parent, this.selected);
       }
    }

    searchAndSetIndex() {
        if (!this.selectedPk) {
            this.selected = null;
            return;
        }
        if (this.getEntryPoint()) {
            for (let [index, item] of each(this.items)) {
                let pk = this.jarves.getObjectPk(this.classProperties.object, item);
                if (pk === this.selectedPk) {
                    this.selected = index;
                    return;
                }
            }
            this.selected = null;
        }
    }

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

        return this.selected === index; 
    }

    getPk(item) {
        return this.jarves.getObjectPk(this.classProperties.object, item);
    }
}