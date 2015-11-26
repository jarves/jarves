export default window.angular;

export var angular = window.angular;

var angularModule = '';

export function setModule(module){
    angularModule = module;
}

function getModule() {
    if (!angularModule && !window.angularDecoratorModule){
        throw new Error('Can not use angular typescript decorator: No Angular module defined. Use angular.ts::setModule() first.');
    }

    return angularModule || window.angularDecoratorModule;
}

export function Inject(...dependencies) {
    return function decoratorFactory(target : Object, decoratedPropertyName? : string) : void {
        var normalizedDependencies = [];
        for (let dep of dependencies) {
            normalizedDependencies = normalizedDependencies.concat(dep.replace(/\s+/g, '').split(','));
        }

        var $inject = target.$inject = [];
        $inject = $inject.concat(normalizedDependencies);
        target.prototype.$inject = $inject;
        target.$inject = $inject;
    }
}

export function Service(name) {
    return function decoratorFactory(target : Object, decoratedPropertyName? : string) : void {
        getModule().service(name, target);
    }
}

export function Filter(name) {
    return function decoratorFactory(target : Function, decoratedPropertyName? : string) : void {
        var constructor = function() {
            let instance = new target();
            return instance.filter;
        };
        getModule().filter(name, constructor);
    }
}

export function Directive(name, options) {
    return function decoratorFactory(target : Object, decoratedPropertyName? : string) : void {
        //console.log('@Directive', name, options, target, decoratedPropertyName);

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
                //console.log('link @Directive', name, definition.require, [ctrl]);
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

        getModule().directive(
            name,
            options
        );
    }
}

var loadedController = {};

export function registerControllerDecorator() {
    getModule().directive('ngController', function ($compile) {
            return {
                priority: 1600,
                terminal: true, //stops the element from being compiled, even before the origin ng-controller directives
                controller: function(){},
                compile: function(el) {
                    var children = el.children().remove();

                    return function (scope, iElement, iAttrs, controller, transcludeFn) {
                        var constructor = iAttrs['ngController'];

                        if (angular.isString(constructor) && constructor.slice(0, 'bundles/'.length) === 'bundles/') {

                            var controllerName = constructor;
                            if (-1 !== controllerName.indexOf(' as ')) {
                                controllerName = controllerName.substr(0, controllerName.indexOf(' as '));
                            }

                            var fileToLoad = './' + controllerName + '.ts';

                            // load the actual controller file with all depedencies and compile the element finally
                            window.System.import(fileToLoad).then(function (m) {
                                loadedController[controllerName] = m.default;
                                iElement.append(children);
                                $compile(iElement, null, 1500)(scope);
                            });
                        }
                    };
                }
            }
        }
    );

    //when the directive compiles the ng-controller statement we need to make sure $controller is able to find our self-loaded
    //controller
    getModule().config(function($provide) {
        $provide.decorator("$controller", ['$delegate', '$q', ($delegate, $q) => {
            return function(...args) {
                var [constructor] = args;

                if (angular.isString(constructor)) {
                    var controllerName = constructor;
                    var controllerAs = '';
                    if (-1 !== controllerName.indexOf(' as ')) {
                        controllerAs = controllerName.substr(controllerName.indexOf(' as ') + 4);
                        controllerName = controllerName.substr(0, controllerName.indexOf(' as '));
                    }
                    if (loadedController[controllerName]) {
                        args[0] = loadedController[controllerName];
                        args[3] = controllerAs;
                        return $delegate(...args);
                    }
                }

                return $delegate(...args);
            };
        }]);
    });
}






















export function Label(name, options = {}) {
    return function decoratorFactory(target : Function, decoratedPropertyName? : string) : void {
        //console.log('@Label', name, target, decoratedPropertyName);

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

        getModule().directive(
            directiveName,
            function() {
                return options;
            }
        );
    }
}

import AbstractFieldType from './fields/AbstractFieldType.ts';
export function Field(name, directiveOptions) {
    return function decoratorFactory(target:Object, decoratedPropertyName?:string):void {
        var directiveName = 'jarves' + name.ucfirst() + 'Field';

        //console.log('@Field', name, directiveName);
        getModule().directive(
            directiveName,
            function () {
                //console.log('call ', name, directiveName);
                return angular.extend({
                //return {
                    restrict: 'A',
                    controller: target,
                    controllerAs: 'jarvesField',
                    scope: true,
                    transclude: true,
                    require: [directiveName, 'jarvesField', '?^jarvesField', '?^jarvesForm', '?^jarvesWindow'],
                    compile: function(...args) {
                        if (target.compile) {
                            var linkMethod = target.compile(...args);
                            if (linkMethod) {
                                return linkMethod;
                            }
                        }

                        return function (scope, element, attr, ctrl, transclude) {
                            var ownController:AbstractFieldType = ctrl[0];
                            var fieldController = ctrl[1];
                            var parentFieldController = ctrl[2];
                            var jarvesFormController = ctrl[3];
                            var jarvesWindowController = ctrl[4];
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
                            if (jarvesWindowController) {
                                ownController.setJarvesWindow(jarvesWindowController);
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
