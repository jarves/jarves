import {registerField, registerDirective, registerFilter, registerLabel} from './module.js';

export default window.angular;

export var angular = window.angular;

export function registerAnnotation(constructor, annotation) {
    if (!('annotations' in constructor)) {
        constructor.annotations = [];
    }

    constructor.annotations.push(annotation);
}

export class InjectAnnotation {
    constructor(...deps) {
        this.deps = [];
        for (let dep of deps) {
            this.deps = this.deps.concat(dep.replace(/\s+/g, '').split(','));
        }
    }
}

export class InjectAsPropertyAnnotation {
    constructor(name, propertyName = null) {
        this.name = name;
        this.propertyName = propertyName || name;
    }
}


export class DirectiveAnnotation {
    constructor(name, options){
        this.name = name;
        this.options = options;
    }
}

export class FilterAnnotation {
    constructor(name) {
        this.name = name;
    }
}

export class FieldAnnotation {
    constructor(name, options){
        this.name = name;
        this.options = options;
    }
}

export class LabelAnnotation {
    constructor(name, options){
        this.name = name;
        this.options = options;
    }
}

export function Inject(...deps) {
    return function(constructor) {
        registerAnnotation(constructor, new InjectAnnotation(...deps));
    }
}

export function InjectAsProperty(name, propertyName) {
    return function(constructor) {
        registerAnnotation(constructor, new InjectAsPropertyAnnotation(name, propertyName));
    }
}

export function Directive(name, options){
    return function(constructor) {
        registerAnnotation(constructor, new DirectiveAnnotation(name, options));
        registerDirective(constructor);
    }
}

export function Filter(name) {
    return function(constructor) {
        registerAnnotation(constructor, new FilterAnnotation(name));
        registerFilter(constructor);
    }
}

export function Field(name, options) {
    return function(constructor) {
        registerAnnotation(constructor, new FieldAnnotation(name, options));
        registerField(constructor);
    }
}

export function Label(name, options) {
    return function(constructor) {
        registerAnnotation(constructor, new LabelAnnotation(name, options));
        registerLabel(constructor);

    }
}

export class Parser {

    constructor(constructor) {
        this.constructor = constructor;
    }

    getAllAnnotations() {
        return this.annotations || (this.annotations = this.extractAnnotations(this.constructor));
    }

    getAnnotations(annotationConstructor) {
        var annotations = this.getAllAnnotations();
        var result = [];
        for (let annotation of annotations) {
            if (annotation instanceof annotationConstructor) {
                result.push(annotation);
            }
        }
        return result;
    }

    extractAnnotations(constructor) {
        var annotations = constructor.annotations || [];
        var parent = Object.getPrototypeOf(constructor);
        if (angular.isFunction(parent)) {
            annotations = annotations.concat(this.extractAnnotations(parent));
        }
        return annotations;
    }

}