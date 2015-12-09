import {Directive, Inject} from '../angular.ts';
import {each} from '../utils.ts';
import angular from '../angular.ts';

import Jarves from '../services/Jarves.ts';
import WindowManagement from '../services/WindowManagement.ts';
import ObjectRepository from '../services/ObjectRepository.ts';

@Directive('jarvesGrid', {
    restrict: 'E',
    scope: true,
    transclude: true,
    templateUrl: 'bundles/jarves/views/directives/jarvesGrid.html',
    controllerAs: 'jarvesGrid'
})
export default class JarvesGrid {

    public classProperties = {};
    public selected;

    public entryPoint;

    constructor(private $scope, private $element, private $attrs, private backend, private $q, private $parse, private jarves, private objectRepository) {
        this.entryPoint = $scope.$parent.$eval($attrs.entryPoint);

        if ($attrs.model) {
            $scope.$parent.$watch($attrs.model, (value) => {
                this.selected = value;
            });

            $scope.$watch('jarvesGrid.selected', (value) => {
                this.$parse(this.$attrs.model).assign(this.$scope.$parent, value);
            });
        }
    }

    private transclude;
    private preSelect;

    link(scope, element, attributes, controller, transclude) {
        this.transclude = transclude;
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

    loadClassProperties() {
        this.backend.post(this.getEntryPoint()+'/?_method=options')
            .success((response) => {
                this.classProperties = response.data;
            })
            .error((response) => {
                this.error = response;
                throw response;
            });
    }

    public currentPage;
    public itemsCount;

    private collection;

    loadPage(page = 1) {
        this.currentPage = page;

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
        this.collection.onChange((items) => {
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
            .success((response)=>{
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

    isSelected(item) {
        var pk = this.jarves.getObjectPk(this.classProperties.object, item);

        return angular.equals(pk, this.selected);
    }

    getPk(item) {
        return this.jarves.getObjectPk(this.classProperties.object, item);
    }
}