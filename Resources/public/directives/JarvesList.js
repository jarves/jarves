jarves.Directives.JarvesList = new Class({
    Statics: {
        $inject: ['$scope', '$element', '$attrs', 'backend', '$q', '$parse', 'windowService', 'jarves', 'objectRepository']
    },

    JarvesDirective: {
        name: 'jarvesList',
        options: {
            restrict: 'E',
            scope: true,
            transclude: true,
            templateUrl: 'bundles/jarves/admin/js/views/list.html',
            controller: true
        }
    },

    classProperties: {},
    selected: null,

    /**
     *
     * @param $scope
     * @param $element
     * @param $attrs
     * @param backend
     * @param $q
     * @param $parse
     * @param {jarves.Services.WindowService} windowService
     * @param {jarves.Services.Jarves} jarvesServices
     * @param {jarves.Services.ObjectRepository} objectRepository
     */
    initialize: function($scope, $element, $attrs, backend, $q, $parse, windowService, jarvesServices, objectRepository) {
        this.$scope = $scope;
        this.$parse = $parse;
        this.$scope.controller = this;
        this.element = $element;
        this.backend = backend;
        this.q = $q;
        this.$attrs = $attrs;
        this.windowService = windowService;
        this.jarves = jarvesServices;
        this.objectRepository = objectRepository;

        this.entryPoint = $scope.$parent.$eval($attrs.entryPoint);

        if ($attrs.model) {
            $scope.$parent.$watch($attrs.model, function(value) {
                this.selected = value;
            }.bind(this));

            $scope.$watch('controller.selected', function(value) {
                this.$parse(this.$attrs.model).assign(this.$scope.$parent, value);
            }.bind(this));
        }

        this.jarves.loadEntryPointOptions(this.getEntryPoint()).success(function(response) {
            this.classProperties = response.data;
            if (this.classProperties.object && this.preSelect) {
                this.select(this.preSelect);
                delete this.preSelect;
            }
            this.loadPage();
        }.bind(this));
    },

    link: function(scope, element, attributes, controller, transclude) {
        console.log(element.contents());
    },

    getEntryPoint: function() {
        return this.entryPoint;
    },

    loadPage: function(page) {
        this.currentPage = page || 1;

        if (!this.itemsCount) {
            this.loadItemCount().then(function () {
                this.loadPage(page);
            }.bind(this));
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
        this.collection.change(function(items) {
            this.items = items;
        }.bind(this));

        this.collection.load({
            offset: (this.classProperties.itemsPerPage * page) - this.classProperties.itemsPerPage,
            limit: this.classProperties.itemsPerPage
        });
    },

    getSelection: function() {
        var selection = [];
        Object.each(this.classProperties.columns, function(column, id) {
            selection.push(id);
            if (column.selected) {
                Array.each(column.selected, function(field) {
                    if (-1 !== selection.indexOf(field)) {
                        selection.push(field);
                    }
                });
            }
        });
        return selection;
    },

    loadItemCount: function() {
        var deferred = this.q.defer();

        var query = {};

        this.backend.get(this.getEntryPoint() + '/:count', query)
            .success(function(response){
                this.itemsCount = response.data;
                deferred.resolve();
            }.bind(this));

        return deferred.promise;
    },

    getSelected: function() {
        return this.selected;
    },

    ///**
    // *
    // * @param {Object} item
    // */
    //select: function(item) {
    //    if (!this.classProperties.object) {
    //        this.preSelect = item;
    //        return;
    //    }
    //
    //    this.selected = this.jarves.getObjectPk(this.classProperties.object, item);
    //
    //    if (this.$attrs.model) {
    //        //var oldModelValue = this.$scope.$parent.$eval(this.$attrs.model);
    //        //console.log('compare', angular.equals(oldModelValue, this.selected), oldModelValue, this.selected);
    //        //if (!angular.equals(oldModelValue, this.selected)) {
    //        //    console.log('select grid', this.selected, this.$attrs.model);
    //            this.$parse(this.$attrs.model).assign(this.$scope.$parent, this.selected);
    //        //}
    //    }
    //},

    getPk: function(item) {
        return this.jarves.getObjectPk(this.classProperties.object, item);
    }
});