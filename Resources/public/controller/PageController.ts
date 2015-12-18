import {Inject, angular} from '../angular.ts';

export default class PageController {

    public model:Object = {};
    public currentView:number = 1;
    public showTree:boolean = false;

    constructor(protected $scope, protected $q, protected backend, protected objectRepository, protected jarves) {
    }


}