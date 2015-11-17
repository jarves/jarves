//import Jarves from './Jarves.js';
import {each, eachValue} from '../utils.ts';
import {Service, angular} from '../angular.ts';

//@Inject('jarves')
@Service('windowManagement')
export default class WindowManagement {

    /**
     * @param {Jarves} jarves
     */
    constructor(jarves) {
        this.jarves = jarves;
        this.activeEntryPoints = {};
        this.activeWindowId = -1;
        this.currentWindowIndex = 0;
    }

    newWindow(entryPoint, options, parentWindowId, isInline, parameters) {
        var newId = ++this.currentWindowIndex;
        this.activeEntryPoints[newId] = {
            entryPoint: entryPoint,
            options: options,
            parentWindowId : parentWindowId,
            isInline: isInline,
            id: newId,
            parameters: {}
        };
    }

    /**
     *
     * @param {Number} id
     * @returns {WindowController}
     */
    getWindow(id) {
        return this.activeEntryPoints[id].window;
    }

    /**
     * Close a window.
     *
     * @param {Number} id
     */
    close(id) {
        this.getWindow(id).close();
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
    checkOpen (entryPoint, instanceId, params) {
        var opened = false;
        for (let info of eachValue(this.activeEntryPoints)) {
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
        delete this.activeEntryPoints[id];
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
//        this.activeEntryPoints[window.getId()].window = window;
//    },

    getContainer() {
        return this.container;
    }

    setContainer(container) {
        this.container = container;
    }
}