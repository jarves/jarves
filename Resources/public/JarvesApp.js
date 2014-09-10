import angular from './angular';
import jarves from './module';

export default class JarvesApp {
    constructor(container) {
        console.log('jarves bootstrap');
        angular.bootstrap(container || document, ['jarves']);
    }
}