import AbstractFieldType from './AbstractFieldType';
import {Field, InjectAsProperty} from '../annotations';

@Field('file')
@InjectAsProperty('objectRepository')
export default class File extends AbstractFieldType {
    constructor(){
        super.apply(this, arguments);
        this.template = 'bundles/jarves/admin/js/views/field.file.html';
        this.path = '';
        this.value = '';
        this.objectRepository = null;
    }

    link(scope, element, attr) {
        this.parent(scope, element, attr);

        this.renderTemplateUrl(
            this.template
        );

        scope.$parent.$watch(this.getModelName(), function(value) {
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

        this.$timeout(function() {
            deferred.resolve();
        }, 1000);

        return deferred.promise;
    }
}