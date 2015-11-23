import AbstractFieldType from './AbstractFieldType.ts';
import {Field} from '../angular.ts';

@Field('file', {
    templateUrl: 'bundles/jarves/admin/js/views/fields/file.html',
    controllerAs: 'fileController'
})
export default class File extends AbstractFieldType {
    public path = '';
    public value = '';

    constructor(protected $compile, protected $parse, protected $timeout, protected $http, protected $templateCache,
                protected $q, protected $interpolate, protected objectRepository) {
        super(...arguments);
    }

    link(scope, element, attr, controller, transclude) {
        super.link(scope, element, attr, controller, transclude);

        scope.$parent.$watch(this.getModelName(), function (value) {
            this.value = value;
            this.updateSelected();
        }.bind(this));
    }

    openChooser() {

    }

    updateSelected() {

    }

    save() {
        var deferred = this.$q.defer();

        this.$timeout(function () {
            deferred.resolve();
        }, 1000);

        return deferred.promise;
    }
}