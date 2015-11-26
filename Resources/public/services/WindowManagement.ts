//import Jarves from './Jarves.js';
import {each, eachValue} from '../utils.ts';
import {Service, angular} from '../angular.ts';
import JarvesWindow from '../directives/JarvesWindow.ts';
import Jarves from '../services/Jarves.ts';

export enum EntryPointType {
    List = 'list',
    Combined = 'combined',
    Edit = 'edit',
    Add = 'add'
}

export interface EntryPoint {
    fullPath: string,
    path: string,
    icon: string,
    label: string,
    level: number,
    system: boolean,
    templateUrl?: string,
    type: string,
    multi: boolean,
    hasClass: boolean,
    object?: string,
}

export interface WindowInfo {
    id: number,
    entryPoint: EntryPoint,
    options: Object,
    parentWindowId: number,
    isInline: boolean,
    parameters: Object,
    inFront: boolean
}

export interface WindowList {
    [windowId: number]: WindowInfo
}

export interface JarvesWindowList {
    [windowId: number]: JarvesWindow
}

@Service('windowManagement')
export default class WindowManagement {

    public activeWindowList:WindowList = {};
    public activeWindowId = -1;
    public currentWindowIndex = 0;
    public activeWindow:JarvesWindow = null;
    public jarvesWindows:JarvesWindowList = {};

    constructor(protected jarves:Jarves, protected $rootScope) {
        this.activeWindowList = {};
        this.activeWindowId = -1;
        this.currentWindowIndex = 0;
    }

    public restoreWindows() {
        //jarves#!users/users?parameter1=bla&parameter2=dummy
        var hash = window.location.hash.substr(1);
        if (!hash) {
            return;
        }
        var items = hash.split(',');
        var activeWindowsList:WindowList = {};
        for (let item of items) {
            let entryPoint = item.split('?')[0];
            let potentialParameters = item.split('?')[1];
            let parameters = {};
            if (potentialParameters) {
                let parametersArray = potentialParameters.split('&');
                for (let valuePair of parametersArray) {
                    var splitted = valuePair.split('=');
                    parameters[splitted[0]] = decodeURIComponent(splitted[1]);
                }
            }
            var newId = ++this.currentWindowIndex;

            let inFront = false;
            if ('!' === entryPoint[0]) {
                entryPoint = entryPoint.substr(1);
                inFront = true;
            }
            activeWindowsList[newId] = {
                id: newId,
                entryPoint: this.jarves.getEntryPoint(entryPoint),
                options: {},
                parameters: parameters,
                isInline: false,
                inFront: inFront,
                parentWindowId: 0
            };
        }

        console.log('recovered windows', activeWindowsList);
        this.activeWindowList = activeWindowsList;
    }

    public newWindow(entryPoint:EntryPoint, options:Object = {}, parentWindowId:number = 0, isInline:boolean = false, parameters:Object = {}) {
        var newId = ++this.currentWindowIndex;
        this.activeWindowList[newId] = {
            entryPoint: entryPoint,
            options: options,
            parentWindowId: parentWindowId,
            isInline: isInline,
            id: newId,
            inFront: false,
            parameters: {}
        };
    }

    /**
     *
     * @param {Number} id
     * @returns {JarvesWindow}
     */
    getWindow(id) {
        return this.jarvesWindows[id];
    }

    setWindow(id, instance:JarvesWindow) {
        this.jarvesWindows[id] = instance;
    }

    /**
     * Rebuilds the url hash after #.
     */
    public updateUrlHash():void {
        var hash = [];
        for (let win of eachValue(this.activeWindowList)) {
            if (!win.parentWindowId && !win.isInline) {
                let parameters = [];
                for (let [k, v] of each(win.parameters)) {
                    parameters.push(k + '=' + encodeURIComponent(v));
                }
                var part = win.entryPoint.fullPath + '?' + parameters.join('&');
                if (win.inFront) {
                    part = '!' + part;
                }
                hash.push(part);
            }
        }

        //jarves#!users/users?parameter1=bla&parameter2=dummy
        window.location.hash = hash.join(',');
    }

    /**
     * Close a window.
     */
    public close(id:number):void {
        this.getWindow(id).close();
    }

    public isActive(id:number):boolean {
        return this.getWindow(id).getWindowInfo().inFront;
    }

    /**
     * Checks if a window is already open.
     *
     * @param {String} entryPoint
     * @param {Number} instanceId
     * @param {Object} params
     *
     * @returns {Boolean}
     */
    public checkOpen(entryPoint:Object, instanceId, params) {
        var opened = false;
        for (let info of eachValue(this.activeWindowList)) {
            var win = info.window;
            if (win && win.getEntryPoint() == entryPoint) {
                if (instanceId && instanceId == win.getId()) {
                    return;
                }
                if (params) {
                    if (JSON.encode(win.getOriginParameters()) != JSON.encode(params)) {
                        return;
                    }
                }
                opened = win;
            }
        }

        return opened;
    }

    /**
     *
     * Unregister a window from the registry.
     *
     * @param {Number} id
     */
    unregister(id) {
        delete this.activeWindowList[id];
    }

    toFront(id:number) {
        var window = this.getWindow(id);

        if (this.activeWindow && this.activeWindow != window) {
            this.activeWindow.getWindowInfo().inFront = false;
        }

        this.activeWindowId = window.getId();
        this.activeWindow = window;
        this.activeWindow.getWindowInfo().inFront = true;
    }

//    /**
//     * @param {jarves.Controller.Window} window
//     */
//    registerWindow: function(window) {
//        this.activeWindowList[window.getId()].window = window;
//    },

    getContainer() {
        return this.container;
    }

    setContainer(container) {
        this.container = container;
    }
}