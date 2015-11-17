//import {registerField, registerDirective, registerFilter, registerLabel} from './module.ts';


export default window.angular;

export var angular = window.angular;


//export function Service(name) {
//    return function decoratorFactory(target : Object, decoratedPropertyName? : string) : void {
//        console.log('@Service', target, decoratedPropertyName);
//        window.jarvesModule.service(name, target);
//    }
//}


//export function registerAnnotation(constructor, annotation) {
//    if (!('annotations' in constructor)) {
//        constructor.annotations = [];
//    }
//
//    constructor.annotations.push(annotation);
//}

//export var InjectAnnotation = class {
//    deps: Array;
//
//    constructor(...deps) {
//        for (let dep of deps) {
//            this.deps = this.deps.concat(dep.replace(/\s+/g, '').split(','));
//        }
//    }
//};

export function Inject(...dependencies) {
    return function decoratorFactory(target : Object, decoratedPropertyName? : string) : void {
        var normalizedDependencies = [];
        for (let dep of dependencies) {
            normalizedDependencies = normalizedDependencies.concat(dep.replace(/\s+/g, '').split(','));
        }

        var $inject = target.$inject = [];
        $inject = $inject.concat(normalizedDependencies);

        //
        //Object.defineProperty(target.prototype, "$inject", {
        //    get: function () {
        //        return this._$inject;
        //    },
        //    set: function (v) {
        //        this._$inject = v;
        //    },
        //    enumerable: false,
        //    configurable: true
        //});

        //target.constructor.prototype.$inject = $inject;
        target.prototype.$inject = $inject;
        target.$inject = $inject;

        //target.$inject = target.$inject.concat(normalizedDependencies);
        console.log('@Inject', $inject, target, decoratedPropertyName);
    }
}

export function Service(name) {
    return function decoratorFactory(target : Object, decoratedPropertyName? : string) : void {
        console.log('@Service', name, target, decoratedPropertyName);
        window.jarvesModule.service(name, target);
    }
}

export function Filter(name) {
    return function decoratorFactory(target : Function, decoratedPropertyName? : string) : void {
        console.log('@Filter', name, target, decoratedPropertyName);
        var constructor = function() {
            let instance = new target();
            return instance.filter;
        };
        window.jarvesModule.filter(name, constructor);
    }
}

export function Label(name, options = {}) {
    return function decoratorFactory(target : Function, decoratedPropertyName? : string) : void {
        console.log('@Label', name, target, decoratedPropertyName);

        var directiveName = 'jarves' + name.ucfirst() + 'Label';

        options = angular.extend({
            restrict: 'A',
            controller: target,
            scope: true,
            require: [directiveName, '?^jarvesForm'],
            link: function(scope, element, attr, ctrl, transclude) {
                var ownController = ctrl[0];
                var controllersToPass = ctrl;
                controllersToPass.shift();

                if (controllersToPass && 1 === controllersToPass.length) {
                    controllersToPass = controllersToPass[0];
                }

                ownController.link.apply(ownController, [scope, element, attr, controllersToPass, transclude]);
            }
        }, options);

        window.jarvesModule.directive(
            directiveName,
            function() {
                return options;
            }
        );
    }
}

export function Field(name, directiveOptions) {
    return function decoratorFactory(target:Object, decoratedPropertyName?:string):void {
        var directiveName = 'jarves' + name.ucfirst() + 'Field';

        console.log('@Field', name, directiveName);
        window.jarvesModule.directive(
            directiveName,
            function () {
                console.log('call ', name, directiveName);
                return angular.extend({
                //return {
                    restrict: 'A',
                    controller: target,
                    scope: true,
                    transclude: true,
                    require: [directiveName, 'jarvesField', '?^jarvesField', '?^jarvesForm'],
                    compile: function(...args) {
                        if (target.compile) {
                            var linkMethod = target.compile(...args);
                            if (linkMethod) {
                                return linkMethod;
                            }
                        }

                        return function (scope, element, attr, ctrl, transclude) {
                            var ownController = ctrl[0];
                            var fieldController = ctrl[1];
                            var parentFieldController = ctrl[2];
                            var jarvesFormController = ctrl[3];
                            var controllersToPass = ctrl;
                            controllersToPass.shift();

                            fieldController.setController(ownController);
                            ownController.setFieldDirective(fieldController);

                            if (parentFieldController) {
                                ownController.setParentFieldDirective(parentFieldController);
                            }

                            if (jarvesFormController) {
                                jarvesFormController.addField(ownController);
                            }

                            if (controllersToPass && 1 === controllersToPass.length) {
                                controllersToPass = controllersToPass[0];
                            }

                            //console.log('Link Field angular.ts', directiveName, element, [directiveName, 'jarvesField', '?^jarvesField', '?^jarvesForm'], ctrl);
                            ownController.link(...[scope, element, attr, controllersToPass, transclude]);
                        }
                    }
                //};
                }, directiveOptions || {});
            }
        );
    }
}

export function Directive(name, options) {
    return function decoratorFactory(target : Object, decoratedPropertyName? : string) : void {
        console.log('@Directive', name, options, target, decoratedPropertyName);

        var definition = options || {};
        if (!definition.controller) {
            definition.controller = target;
        }

        if (!definition.link) {
            if (angular.isString(definition.require)) {
                definition.require = [definition.require];
            }

            if (angular.isArray(definition.require) && name !== definition.require[0]) {
                definition.require.unshift(name);
            }

            definition.link = function(scope, element, attr, ctrl, transclude) {
                var ownController, controllersToPass;
                console.log('link @Directive', name, definition.require, [ctrl]);
                if (angular.isArray(ctrl)) {
                    ownController = ctrl.shift();
                } else {
                    ownController = ctrl;
                }

                if (angular.isArray(ctrl) && 1 === ctrl.length) {
                    ctrl = ctrl[0];
                }

                if (ownController && ownController.link) {
                    ownController.link.apply(ownController, [scope, element, attr, ctrl, transclude]);
                }
            };
        }

        var compile:Function = definition.compile || function(){};
        definition.compile = function(...args) {
            var link = compile(...args);
            return link || definition.link;
        };

        options = angular.isFunction(definition) || angular.isArray(definition)
            ? definition
            : function(){ return definition; };

        window.jarvesModule.directive(
            name,
            options
        );
    }
}


//export class InjectAsPropertyAnnotation {
//    name: string;
//    propertyName: string;
//
//    constructor(name, propertyName = null) {
//        this.name = name;
//        this.propertyName = propertyName || name;
//    }
//}
////
//export class DirectiveAnnotation {
//    constructor(name, options){
//        this.name = name;
//        this.options = options;
//    }
//}
//
//export class FilterAnnotation {
//    constructor(name) {
//        this.name = name;
//    }
//}
//
//export class FieldAnnotation {
//    constructor(name, options){
//        this.name = name;
//        this.options = options;
//    }
//}
//
//export class LabelAnnotation {
//    constructor(name, options){
//        this.name = name;
//        this.options = options;
//    }
//}
//
//export function InjectAsProperty(name, propertyName) {
//    return function(constructor) {
//        registerAnnotation(constructor, new InjectAsPropertyAnnotation(name, propertyName));
//    }
//}
//
//export function Directive(name, options){
//    return function(constructor) {
//        registerAnnotation(constructor, new DirectiveAnnotation(name, options));
//        registerDirective(constructor);
//    }
//}
//
////export function Filter(name) {
////    return function(constructor) {
////        registerAnnotation(constructor, new FilterAnnotation(name));
////        registerFilter(constructor);
////    }
////}
////
////export function Field(name, options) {
////    return function(constructor) {
////        registerAnnotation(constructor, new FieldAnnotation(name, options));
////        registerField(constructor);
////    }
////}
////
////export function Label(name, options) {
////    return function(constructor) {
////        registerAnnotation(constructor, new LabelAnnotation(name, options));
////        registerLabel(constructor);
////
////    }
////}
////
//export class Parser {
//
//    constructor(constructor) {
//        this.constructor = constructor;
//    }
//
//    getAllAnnotations() {
//        return this.annotations || (this.annotations = this.extractAnnotations(this.constructor));
//    }
//
//    getAnnotations(annotationConstructor) {
//        var annotations = this.getAllAnnotations();
//        var result = [];
//        for (let annotation of annotations) {
//            if (annotation instanceof annotationConstructor) {
//                result.push(annotation);
//            }
//        }
//        return result;
//    }
//
//    extractAnnotations(constructor) {
//        var annotations = constructor.annotations || [];
//        var parent = Object.getPrototypeOf(constructor);
//        if (angular.isFunction(parent)) {
//            annotations = annotations.concat(this.extractAnnotations(parent));
//        }
//        return annotations;
//    }
//
//}