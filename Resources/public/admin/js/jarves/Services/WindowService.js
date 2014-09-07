jarves.Services.WindowService = new Class({
    Statics: {
        $inject: ['jarves']
    },
    JarvesService: 'windowService',

//    newWindow: function(entryPoint, newWindowId, options, isInline, parentWindowId) {
//        return new jarves.Window(entryPoint, newWindowId, options, isInline, parentWindowId);
//    },

    activeEntryPoints: {},
    activeWindowId: -1,
    currentWindowIndex: 0,

    initialize: function(jarves) {
        this.jarves = jarves;
    },

    newWindow: function(entryPoint, options, parentWindowId, isInline, parameters) {
        var newId = ++this.currentWindowIndex;
        this.activeEntryPoints[newId] = {
            entryPoint: entryPoint,
            options: options,
            parentWindowId : parentWindowId,
            isInline: isInline,
            id: newId,
            parameters: {}
        };
    },

    /**
     *
     * @param {Number} id
     * @returns {jarves.Controller.Window}
     */
    getWindow: function(id) {
        return this.activeEntryPoints[id].window;
    },

    /**
     * Close a window.
     *
     * @param {Number} id
     */
    close: function(id) {
        this.getWindow(id).close();
    },

    /**
     * Checks if a window is already open.
     *
     * @param {String} entryPoint
     * @param {Number} instanceId
     * @param {Object} params
     * @returns {boolean}
     */
    checkOpen: function (entryPoint, instanceId, params) {
        var opened = false;
        Object.each(this.activeEntryPoints, function (info) {
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
        });

        return opened;
    },

    /**
     *
     * Unregister a window from the registry.
     *
     * @param {Number} id
     */
    unregister: function(id) {
        delete this.activeEntryPoints[id];
    },

    /**
     *
     * @param {Number|jarves.Controller.WindowController} window
     */
    toFront: function(window) {
        if ('number' === typeOf(window)) {
            window = this.getWindow(window);
        }

        if (this.activeWindow && this.activeWindow != window) {
            this.activeWindow.setActive(false);
        }

        this.activeWindowId = window.getId();
        this.activeWindow = window;
        this.activeWindow.setActive(true);
    },

//    /**
//     * @param {jarves.Controller.Window} window
//     */
//    registerWindow: function(window) {
//        this.activeEntryPoints[window.getId()].window = window;
//    },

    getContainer: function() {
        return this.container;
    },

    setContainer: function(container) {
        this.container = container;
    }
});