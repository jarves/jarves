/* jarves window.manager */
jarves.wm = {
    windows: {},

    instanceIdx: 0,
    /* depend: [was => mitWem] */
    depend: {},
    lastWindow: null,
    events: {},
    zIndex: 1000,

    activeWindowInformation: [],
    tempItems: {},

    openWindow: function (entryPointPath, pLink, pParentWindowId, pParams, pInline) {
        var win;

        if (!jarves.entrypoint.get(entryPointPath)) {
            logger(tf('Entry point `%s` not found.', entryPointPath));
            return;
        }

        if (!pInline && window.event && window.event.which === 2) {
            //open new tab.
            top.open(location.pathname + '#' + entryPointPath, '_blank');
            return;
        }

        if ((win = this.checkOpen(entryPointPath, null, pParams)) && !pInline) {
            return win.toFront();
        }

        return jarves.wm.loadWindow(entryPointPath, pLink, pParentWindowId, pParams, pInline);
    },

    addEvent: function (pEv, pFunc) {
        if (!jarves.wm.events[pEv]) {
            jarves.wm.events[pEv] = [];
        }

        jarves.wm.events[pEv].include(pFunc);
    },

    fireEvent: function (pEv) {
        if (jarves.wm.events[pEv]) {
            Object.each(jarves.wm.events[pEv], function (func) {
                $try(func);
            });
        }
    },

    open: function (pEntryPoint, pParams, pParentWindowId, pInline) {
        return jarves.wm.openWindow(pEntryPoint, null, pParentWindowId, pParams, pInline);
    },

    getWindow: function (pId) {
        if (pId == -1 && jarves.wm.lastWindow) {
            pId = jarves.wm.lastWindow.getId();
        }
        return jarves.wm.windows[ pId ];
    },

    getWindows: function() {
        return jarves.wm.windows;
    },

    sendSoftReload: function (pEntryPoint) {
        jarves.wm.softReloadWindows(pEntryPoint);
    },

    softReloadWindows: function (pEntryPoint) {
        Object.each(jarves.wm.windows, function (win) {
            if (win && win.getEntryPoint() == pEntryPoint) {
                win.softReload();
            }
        });
    },

    fireResize: function () {
        Object.each(jarves.wm.windows, function (win) {
            win.fireEvent('resize');
        });
    },

    resizeAll: function () {
        jarves.settings['user']['windows'] = {};
        Object.each(jarves.wm.windows, function (win) {
            win.loadDimensions();
        });
    },

    getActiveWindow: function() {
        return jarves.wm.lastWindow;
    },

    setFrontWindow: function (pWindow) {
        Object.each(jarves.wm.windows, function (win, winId) {
            if (win && pWindow.id != winId) {
                win.toBack();
            }
        });
        jarves.wm.lastWindow = pWindow;
    },

    loadWindow: function (pEntryPoint, pLink, pParentWindowId, pParams, pInline) {
        var instance = ++jarves.wm.instanceIdx;

        if (pParentWindowId == -1 || (pInline && !pParentWindowId)) {
            pParentWindowId = jarves.wm.lastWindow ? jarves.wm.lastWindow.id : false;
        }

        if (false === pParentWindowId || (pParentWindowId && !jarves.wm.getWindow(pParentWindowId))) {
            throw tf('Parent `%d` window not found.', pParentWindowId);
        }

        pEntryPoint = jarves.normalizeEntryPointPath(pEntryPoint);
        jarves.wm.windows[instance] = new jarves.Window(pEntryPoint, pLink, instance, pParams, pInline, pParentWindowId);
        jarves.wm.windows[instance].toFront();
        jarves.wm.updateWindowBar();
        jarves.wm.reloadHashtag();
        return jarves.wm.windows[instance];
    },

    close: function (pWindow) {
        var parent = pWindow.getParent();
        if (parent && instanceOf(parent, jarves.Window)) {
            parent.removeChildren();
        }

        if (jarves.wm.tempItems[pWindow.getId()]) {
            jarves.wm.tempItems[pWindow.getId()].destroy();
            delete jarves.wm.tempItems[pWindow.getId()];
        }

        delete jarves.wm.windows[pWindow.id];

        if (parent) {
            parent.toFront();
        } else {
            jarves.wm.bringLastWindow2Front();
        }

        jarves.wm.updateWindowBar();
        jarves.wm.reloadHashtag();
    },

    bringLastWindow2Front: function () {
        var lastWindow;

        Object.each(jarves.wm.windows, function (win) {
            if (!win) {
                return;
            }
            if (!lastWindow || win.border.getStyle('z-index') > lastWindow.border.getStyle('z-index')) {
                lastWindow = win;
            }
        });

        if (lastWindow) {
            lastWindow.toFront();
        }
    },

    getWindowsCount: function () {
        var count = 0;
        Object.each(jarves.wm.windows, function (win, winId) {
            if (!win) {
                return;
            }
            if (win.inline) {
                return;
            }
            count++;
        });
        return count;
    },

    updateWindowBar: function () {
        var openWindows = 0;

        var wmTabContainer = jarves.adminInterface.getWMTabContainer();

        wmTabContainer.empty();
        var fragment = document.createDocumentFragment();

        var el, icon;
        Object.each(jarves.wm.windows, function (win) {
            if (win.getParent()) {
                return;
            }

            if (win.isInFront()) {
                openWindows++;
            }

            el = new Element('div', {
                'class': 'jarves-wm-tab' + (win.isInFront() ? ' jarves-wm-tab-active' : ''),
                text: win.getTitle() || (win.getEntryPointDefinition() || {}).label
            })
            .addEvent('mouseup', function(e){
                if(e.isMiddleClick()){
                    win.close(true);
                    e.stop();
                }
            })
            .addEvent('click', function(){ win.toFront(); });

            if (icon = (win.getEntryPointDefinition() || {}).icon) {
                if ('#' === icon.substr(0, 1)) {
                    el.addClass(icon.substr(1));
                } else {
                    //new img
                }
            }

            new Element('a', {
                'class': 'icon-cancel-8'
            }).addEvent('click', function(e){
                win.close(true);
                e.stop();
            }).inject(el);

            fragment.appendChild(el);
        });

        wmTabContainer.appendChild(fragment);

        if (jarves.adminInterface.dashboardLink) {
            if (0 === openWindows) {
                jarves.adminInterface.dashboardLink.addClass('jarves-main-menu-item-open');
                jarves.adminInterface.dashboardLink.addClass('jarves-main-menu-item-active');
            } else {
                jarves.adminInterface.dashboardLink.removeClass('jarves-main-menu-item-open');
                jarves.adminInterface.dashboardLink.removeClass('jarves-main-menu-item-active');
            }
            jarves.adminInterface.showDashboard(0 === openWindows);
        }

        jarves.wm.reloadHashtag();
    },

    reloadHashtag: function (pForce) {
        var hash = []

        Object.each(jarves.wm.windows, function (win) {
            if (!win.isInline()) {
                hash.push(win.getEntryPoint() + ( win.hasParameters() ? '?' + Object.toQueryString(win.getParameters()) : '' ));
            }
        });

        hash = hash.join(';');

        if (hash != window.location.hash) {
            window.location.hash = hash;
        }

    },

    handleHashtag: function (pForce) {
        if (jarves.wm.hashHandled && !pForce) {
            return;
        }

        jarves.wm.hashHandled = true;

        if (!window.location.hash.substr(1)) {
            return;
        }

        var hashes = window.location.hash.substr(1).split(';');

        if (hashes) {
            Array.each(hashes, function(hash){
                var first = hash.indexOf('?');
                var entryPoint = hash;
                var parameters = null;
                if (first !== -1) {
                    entryPoint = entryPoint.substr(0, first);

                    parameters = hash.substr(first + 1);
                    if (parameters && 'string' === typeOf(parameters)) {
                        parameters = parameters.parseQueryString();
                    }
                }
                jarves.wm.open(entryPoint, parameters);
            });
        }
    },

    removeActiveWindowInformation: function () {
        jarves.adminInterface.mainMenuTopNavigation.getElements('a').removeClass('jarves-main-menu-item-active');
        jarves.adminInterface.mainMenu.getElements('a').removeClass('jarves-main-menu-item-active');
        jarves.adminInterface.mainMenuTopNavigation.getElements('a').removeClass('jarves-main-menu-item-open');
        jarves.adminInterface.mainLinks.getElements('a').removeClass('jarves-main-menu-item-open');
    },

    checkOpen: function (pEntryPoint, pInstanceId, pParams) {
        var opened = false;
        Object.each(jarves.wm.windows, function (win) {
            if (win && win.getEntryPoint() == pEntryPoint) {
                if (pInstanceId && pInstanceId == win.id) {
                    return;
                }
                if (pParams) {
                    if (JSON.encode(win.getOriginParameters()) != JSON.encode(pParams)){
                        return;
                    }
                }
                opened = win;
            }
        });
        return opened;
    },

    closeAll: function () {
        Object.each(jarves.wm.windows, function (win) {
            win.close();
        });
    },

    hideContents: function () {
        Object.each(jarves.wm.windows, function (win, winId) {
            win.content.setStyle('display', 'none');
        });
    },

    showContents: function () {
        Object.each(jarves.wm.windows, function (win, winId) {
            win.content.setStyle('display', 'block');
        });
    }
};

window.addEvent('resize', function(){
    jarves.wm.fireResize();
});
