export class Directive {
    constructor(name, options){
        this.name = name;
        this.options = options;
    }
}

export class Filter {
	constructor(name) {
		this.name = name;
	}
}

export class Field {
    constructor(name, options){
        this.name = name;
        this.options = options;
    }
}

export class Inject {
    constructor(...deps){
    	this.deps = [];
    	for (let dep of deps) {
    		this.deps = this.deps.concat(dep.replace(/\s+/g, '').split(','));
    	}
    }
}

export class InjectAsProperty {
	constructor(name, propertyName = null) {
		this.name = name;
		this.propertyName = propertyName || name;
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
		if ('function' === typeof parent) {
			annotations = annotations.concat(this.extractAnnotations(parent));
		}
		return annotations;
	}

}