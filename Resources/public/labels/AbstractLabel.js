import AbstractFieldType from '../fields/AbstractFieldType.js';

export default class AbstractLabel extends AbstractFieldType {
    getModelName() {
        return this.getOption('model') || this.$attrs.data + '.' + this.getOption('id');
    }

    getParentModelName() {
        return '$parent.' + this.getModelName();
    }

    link(scope, element, attributes) {

    }
}