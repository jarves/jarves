import AbstractFieldType from './AbstractFieldType.ts';
import {Field} from '../angular.ts';
import WindowManagement from "../services/WindowManagement";
import ObjectRepository from "../services/ObjectRepository";

@Field('object', {
    templateUrl: 'bundles/jarves/views/fields/object.html'
})
export default class Object extends AbstractFieldType {
    public path = '';
    public value = '';

    constructor(protected $compile, protected $parse, protected $timeout, protected $http, protected $templateCache,
                protected $q, protected $interpolate, protected objectRepository:ObjectRepository, protected windowManagement:WindowManagement) {
        super(...arguments);
    }

    link(scope, element, attr, controller, transclude) {
        super.link(scope, element, attr, controller, transclude);

        scope.$parent.$watch(this.getModelName(), function (value) {
            this.value = value;
        }.bind(this));

        console.log('link Object', this.getOption('type'), this.definition);
    }

    openChooser() {
        this.windowManagement.openDialog('jarves/backend/chooser', {
            onChoose: function(value) {
                console.log('chosen value', value);
            }
        });
    }

    updateSelected() {

    }
}