import AbstractFieldType from '../fields/AbstractFieldType.ts';

export default class AbstractLabel extends AbstractFieldType {
    getModelName() {
        return this.getOption('model') || this.attributes.data + '.' + this.getOption('id');
    }

    getParentModelName() {
        return '$parent.' + this.getModelName();
    }

    link(scope, element, attributes) {
        this.linked = true;

        this.scope = scope;
        this.element = element;
        this.attributes = attributes;
    }
}