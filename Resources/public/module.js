import JarvesService from './services/Jarves';
import WindowManagement from './services/WindowManagement';
import Translator from './services/Translator';
import ObjectRepository from './services/ObjectRepository';
import Backend from './services/Backend';

var jarvesModule = window.angular.module('jarves', []);
export default jarvesModule;

jarvesModule.service('jarves', JarvesService);
jarvesModule.service('windowManagement', WindowManagement);
jarvesModule.service('translator', Translator);
jarvesModule.service('objectRepository', ObjectRepository);
jarvesModule.service('backend', Backend);


jarvesModule.config(function($provide) {
    $provide.decorator("$controller", ['$delegate', ($delegate) => {
        return function(constructor, locals) {
            if (angular.isString(constructor)) {
                var module = System.get(constructor);
                if (module) {
                    console.log('es6 module found for ', constructor);
                    constructor = System.get(constructor).default;
                }
            }
            return $delegate(constructor, locals);
        };
    }]);
});

console.log('init jarves angular module');