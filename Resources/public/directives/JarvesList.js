import {Directive, Inject} from '../annotations';
import {each} from '../utils';

@Directive('jarvesList', {
    restrict: 'E',
    scope: true,
    transclude: true,
    templateUrl: 'bundles/jarves/views/list.html',
})
@Inject('$scope, $element, $attrs, backend, $q, $parse, jarves, objectRepository')
export default class JarvesList {
    constructor($scope, $element, $attrs, backend, $q, $parse, jarves, objectRepository) {
        this.$scope = $scope;
        this.$parse = $parse;
        this.$scope.controller = this;
        this.element = $element;
        this.backend = backend;
        this.q = $q;
        this.$attrs = $attrs;
        this.jarves = jarves;
        this.objectRepository = objectRepository;

        this.classProperties = {};
        this.selected = null;

        console.log('new JarvesList ', jarves);

        this.entryPoint = $scope.$parent.$eval($attrs.entryPoint);

        if ($attrs.model) {
            $scope.$parent.$watch($attrs.model, (value) => {
                this.selected = value;
            });

            $scope.$watch('controller.selected', (value) => {
                this.$parse(this.$attrs.model).assign(this.$scope.$parent, value);
            });
        }
    }

    link(scope, element, attributes, controller, transclude) {
        this.jarves.loadEntryPointOptions(this.getEntryPoint()).success((response) => {
            this.classProperties = response.data;
            if (this.classProperties.object && this.preSelect) {
                this.select(this.preSelect);
                delete this.preSelect;
            }
            this.loadPage();
        });
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
        var deferred = this.q.defer();

        var query = {};

        this.backend.get(this.getEntryPoint() + '/:count', query)
            .success((response) => {
                this.itemsCount = response.data;
                deferred.resolve();
            });

        return deferred.promise;
    }

    getSelected() {
        return this.selected;
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
    
       this.selected = this.jarves.getObjectPk(this.classProperties.object, item);
    
       if (this.$attrs.model) {
           //var oldModelValue = this.$scope.$parent.$eval(this.$attrs.model);
           //console.log('compare', angular.equals(oldModelValue, this.selected), oldModelValue, this.selected);
           //if (!angular.equals(oldModelValue, this.selected)) {
           //    console.log('select grid', this.selected, this.$attrs.model);
               this.$parse(this.$attrs.model).assign(this.$scope.$parent, this.selected);
           //}
       }
    }

    getPk(item) {
        return this.jarves.getObjectPk(this.classProperties.object, item);
    }
}