import angular from './angular.js';
import jarves from './module.js';

export default class JarvesApp {
    constructor(container) {
        console.log('jarves bootstrap');
        angular.bootstrap(container || document, ['jarves']);
    }
}
