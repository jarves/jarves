//import Jarves from './Jarves.js';
import {each, eachValue} from '../utils.ts';
import {Service, angular} from '../angular.ts';
import JarvesWindow from '../directives/JarvesWindow.ts';

enum EntryPointType {
    List = 'list',
    Combined = 'combined',
    Edit = 'edit',
    Add = 'add'
}

interface EntryPoint {
    fullPath: string,
    path: string,
    icon: string,
    label: string,
    level: number,
    system: boolean,
    templateUrl?: string,
    type: EntryPointType
}

interface WindowInfo {
    id: number,
    entryPoint: EntryPoint,
    options: Object,
    parentWindowId: number,
    isInline: boolean,
    parameters: Object,
    window?: JarvesWindow
}

interface WindowList {
    [windowId: number]: WindowInfo
}

@Service('windowManagement')
export default class WindowManagement {

    public activeWindowList : WindowList = {};
    public activeWindowId = -1;
    public currentWindowIndex = 0;
    public activeWindow = null;

    /**
     * @param {Jarves} jarves
     */
    constructor(protected jarves) {
        this.activeWindowList = {};
        this.activeWindowId = -1;
        this.currentWindowIndex = 0;
    }

    public newWindow(entryPoint:EntryPoint, options = {}, parentWindowId = 0, isInline = false, parameters = {}) {
        var newId = ++this.currentWindowIndex;
        this.activeWindowList[newId] = {
            entryPoint: entryPoint,
            options: options,
            parentWindowId: parentWindowId,
            isInline: isInline,
            id: newId,
            parameters: {}
        };
        this.updateUrlHash();
    }

    /**
     *
     * @param {Number} id
     * @returns {JarvesWindow}
     */
    getWindow(id) {
        return this.activeWindowList[id].window;
    }

    /**
     * Rebuilds the url hash after #.
     */
    protected updateUrlHash() : void {
        var hash = [];
        for (let win of eachValue(this.activeWindowList)) {
            if (!win.parentWindowId) {
                let parameters = [];
                for (let [k, v] of each(win.parameters)) {
                    parameters.push(k + '=' + encodeURIComponent(v));
                }
                var part = win.entryPoint.fullPath + '?' + parameters.join('&');
                if (this.isActive(win.id)) {
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
    public close(id:number) : void {
        this.getWindow(id).close();
        this.updateUrlHash();
    }

    public isActive(windowId:number) : boolean {
        return windowId === this.activeWindowId;
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
    public checkOpen(entryPoint:object, instanceId, params) {
        var opened = false;
        for (let info of eachValue(this.activeWindowList)) {
            var win = info.window;
            if (win && win.getEntryPoint() == entryPoint) {
                if (instanceId && instanceId == win.getId()) {
                    return;
                }
                if (params) {
                    if (JSON.encode(win.getOriginParameters()) != JSON.encode(params)){
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

    /**
     *
     * @param {Number|jarves.Controller.WindowController} window
     */
    toFront(window) {
        if (angular.isNumber(window)) {
            window = this.getWindow(window);
        }

        if (this.activeWindow && this.activeWindow != window) {
            this.activeWindow.setActive(false);
        }

        this.activeWindowId = window.getId();
        this.activeWindow = window;
        this.activeWindow.setActive(true);
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