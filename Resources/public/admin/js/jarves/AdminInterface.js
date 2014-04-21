jarves.AdminInterface = new Class({

    Binds: [/*'toggleMainLinks', */'openDashboard', 'openApps', 'openSettings'],
    Implements: [Events, Options],

    mobile: false,

    removedMainMenuItems: [],

    _links: {},

    options: {
        frontPage: false
    },

    /**
     * Builds the login etc.
     */
    initialize: function(pOptions) {

        this.setOptions(pOptions);

        if (this.isInit) {
            return;
        } else {
            this.isInit = true;
        }

        document.hiddenElement = new Element('div', {
            styles: {
                position: 'absolute',
                left: -154,
                top: -345,
                width: 1, height: 1, overflow: 'hidden'
            }
        }).inject(document.body);

        if (!this.options.frontPage) {
            this.renderLogin();
        }
    },

    /**
     *
     * @returns {jarves.FileUploader}
     */
    getFileUploader: function() {
        if (!this.kaFilesFileUploader) {
            this.kaFilesFileUploader = new jarves.FileUploader();
        }

        return this.kaFilesFileUploader;
    },

    objectChanged: function(object) {
        object = jarves.normalizeObjectKey(object);

        Object.each(jarves.wm.getWindows(), function(window) {
            window.fireEvent('objectChanged', object);
        });
    },

    hideAppContainer: function() {
        if (Modernizr.csstransforms && Modernizr.csstransitions) {
            jarves.adminInterface.getAppContainer().setStyle(Modernizr.prefixed('transform'), 'translate(0px, 100%)');
        } else {
            if (jarves.adminInterface.getAppDialogAnimation().isRunning()) {
                jarves.adminInterface.getAppDialogAnimation().stop();
            }

            jarves.adminInterface.getAppDialogAnimation().addEvent('complete', function(){
                jarves.adminInterface.getAppContainer().setStyle('display', 'none');
            });

            jarves.adminInterface.getAppDialogAnimation().start({
                top: size.y+61,
                bottom: (size.y+61)*-1
            });
        }
    },

    showAppContainer: function() {
        if (Modernizr.csstransforms && Modernizr.csstransitions) {
            jarves.adminInterface.getAppContainer().setStyle(Modernizr.prefixed('transform'), 'translate(0px, 0px)');
        } else {
            jarves.adminInterface.getAppDialogAnimation().removeEvents('complete');
            jarves.adminInterface.getAppContainer().setStyle('display');

            jarves.adminInterface.getAppDialogAnimation().start({
                top: 61,
                bottom: 0
            });
        }
    },

    getAppDialogAnimation: function() {
        if (!this.appContainerAnimation) {
            this.appContainerAnimation = new Fx.Morph(jarves.adminInterface.getAppContainer(), {
                duration: 500,
                link: 'cancel',
                transition: Fx.Transitions.Cubic.easeOut
            });
        }
        return this.appContainerAnimation;
    },

    openDashboard: function() {
        if (this.checkLastSystemDialog('dashboard')) return;
        this.lastSystemDialog = new jarves.SystemDialog(this.getDialogContainer(), {
            autoClose: true
        });

        this.btnOpenDashboard.addClass('jarves-main-menu-active');
        this.lastSystemDialog.addEvent('close', function(){
            this.btnOpenDashboard.removeClass('jarves-main-menu-active');
        }.bind(this));

        new Element('h1', {
            text: t('Dashboard')
        }).inject(this.lastSystemDialog.getContentContainer());

        this.lastSystemDialog.center();

        var dashboardInstance = new jarves.Dashboard(this.lastSystemDialog.getContentContainer());

        this.lastSystemDialog.addEvent('closed', function() {
            dashboardInstance.destroy();
            this.clearLastSystemDialog();
        }.bind(this));

    },

    getDialogContainer: function(){
        if (!this.dialogContainer) {
            this.dialogContainer = new Element('div', {
                'class': 'jarves-main-dialog-container'
            }).inject(this.getAppContainer(), 'after');
        }
        return this.dialogContainer;
    },

    checkLastSystemDialog: function(id) {
        if (this.lastSystemDialog && this.lastSystemDialog.isOpen()) {
            if (id == this.lastSystemDialogId) {
                delete this.lastSystemDialogId;
                this.lastSystemDialog.close();
                return true;
            }
            this.lastSystemDialog.close();
        }
        this.lastSystemDialogId = id;
        return false;
    },

    clearLastSystemDialog: function() {
        delete this.lastSystemDialog;
        delete this.lastSystemDialogId;
    },

    openApps: function() {
        if (this.checkLastSystemDialog('apps')) return;

        this.lastSystemDialog = new jarves.SystemDialog(this.getDialogContainer(), {
            autoClose: true
        });


        this.mainMenuStartButton.addClass('jarves-main-menu-active');
        this.lastSystemDialog.addEvent('close', function(){
            this.mainMenuStartButton.removeClass('jarves-main-menu-active');
        }.bind(this));

        var lastBundleName;
        var currentContainer;

        var addLink = function(item, parentContainer) {
            if (item.system) {
                return;
            }

            var currentBundleName = item.fullPath.split('/')[0];

            if (lastBundleName) {
                if (lastBundleName != currentBundleName) {
                    currentContainer = new Element('div', {
                        'class': 'jarves-menu-dialog-cat'
                    }).inject(parentContainer);

                    if (jarves.getConfig(currentBundleName)) {
                        new Element('h2', {
                            'class': 'light',
                            text: jarves.getConfig(currentBundleName).label || jarves.getConfig(currentBundleName).name
                        }).inject(currentContainer);
                    }
                }
            } else {
                currentContainer = new Element('div', {
                    'class': 'jarves-menu-dialog-cat'
                }).inject(parentContainer);
                new Element('h1', {
                    text: 'Apps'
                }).inject(currentContainer, 'before');
            }

            lastBundleName = currentBundleName;

            var a = new Element('a', {
                'class': 'jarves-menu-dialog-link',
                text: item.label
            })
                .addEvent('click', function(){
                    this.lastSystemDialog.close();
                    jarves.wm.open(item.fullPath);
                }.bind(this))
                .inject(currentContainer);

            if (item.icon) {
                var icon = new Element('span').inject(a, 'top');
                if ('#' === item.icon.substr(0, 1)) {
                    icon.addClass(item.icon.substr(1));
                } else {
                    new Element('img', {
                        src: jarves.mediaPath(item.icon)
                    }).inject(icon);
                }
            }

        }.bind(this);

        Object.each(this.menuItems, function(item, path) {
            addLink(item, this.lastSystemDialog.getContentContainer());
        }.bind(this));

        this.lastSystemDialog.addEvent('closed', function() {
            this.clearLastSystemDialog();
        }.bind(this));

        this.lastSystemDialog.center();
    },

    getMenuItems: function() {
        return this.menuItems;
    },

    openSettings: function() {
        if (this.checkLastSystemDialog('settings')) return;
        this.lastSystemDialog = new jarves.SystemDialog(this.getDialogContainer(), {
            autoClose: true
        });

        this.btnOpenSystem.addClass('jarves-main-menu-active');
        this.lastSystemDialog.addEvent('close', function(){
            this.btnOpenSystem.removeClass('jarves-main-menu-active');
        }.bind(this));

        var system = new jarves.System(this.lastSystemDialog.getContentContainer(), this.getMenuItems());

        system.addEvent('click', function(){
            this.lastSystemDialog.close();
        }.bind(this));

        this.lastSystemDialog.addEvent('closed', function() {
            this.clearLastSystemDialog();
        }.bind(this));

        this.lastSystemDialog.center(true);
    },

    createLayout: function() {
        this.border = new Element('div', {
            'class': 'jarves-frame jarves-admin'
        }).inject(document.body);

        this.mainMenuTop = new Element('div', {
            'class': 'jarves-main-menu-top'
        }).inject(this.border);

        this.mainMenu = new Element('div', {
            'class': 'jarves-main-menu'
        }).inject(this.mainMenuTop);

        this.btnOpenDashboard = new Element('a',{
            'class': 'icon-stats-up',
            text: tc('mainMenu', 'Dashboard')
        })
            .addEvent('click', this.openDashboard)
            .inject(this.mainMenu);

        this.mainMenuStartButton = new Element('a',{
            'class': 'jarves-main-menu-start',
            text: tc('mainMenu', 'Apps')
        })
            .addEvent('click', this.openApps)
            .inject(this.mainMenu);

        new Element('img', {
            'class': 'jarves-main-menu-start',
            src: _path + 'bundles/jarves/admin/images/jarves-icon.png'
        })
            .inject(this.mainMenuStartButton, 'top');

        this.btnOpenSystem = new Element('a',{
            'class': 'icon-cog-2',
            text: tc('mainMenu', 'System')
        })
            .addEvent('click', this.openSettings)
            .inject(this.mainMenu);

        this.mainMenuTopLogo = new Element('img', {
            'class': 'jarves-main-menu-top-logo',
            src: _path + 'bundles/jarves/admin/images/logo.png'
        }).inject(this.mainMenuTop);

//        this.mainMenuTopNavigation = new Element('div', {
//            'class': 'jarves-main-menu-top-navigation'
//        }).inject(this.mainMenuTop);
//
        this.mainMenuUser = new Element('div', {
            'class': 'jarves-main-menu-user'
        }).inject(this.mainMenuTop);
//
//        this.mainMenuRight = new Element('div', {
//            'class': 'jarves-main-menu-additional'
//        }).inject(this.mainMenuTop);
//
//        this.mainLinks = new Element('div', {
//            'class': 'jarves-mainLinks jarves-scrolling'
//        }).inject(this.mainMenu);

//        this.mainLinksSplitter = new jarves.LayoutSplitter(this.mainMenu, 'right');
//
//        document.id(this.mainLinksSplitter).addClass('jarves-mainLinks-splitter');

//        this.mainLinksSplitter = new Element('div', {
//            'class': 'jarves-mainLinks-splitter'
//        }).inject(this.mainMenu);

//        this.mainLinksSplitterText = new Element('div', {
//            html: '&bullet; &bullet; &bullet;'
//        }).inject(this.mainLinksSplitter);
//
//        this.mainLinkSplitterArrow = new Element('a', {
//            'class': 'icon-arrow-left-5'
//        }).inject(this.mainLinksSplitter);
//
//        this.mainLinkSplitterArrow.addEvent('click', this.toggleMainLinks);
//
//        this.mainMenuIconBar = new Element('div', {
//            'class': 'jarves-iconbar-item'
//        }).inject(this.mainMenuRight);
//
//        this.openFrontendBtn = new Element('a', {
//            'class': 'icon-eye',
//            title: t('Open Frontend'),
//            href: 'javascript: ;'
//        })
//            .addEvent('click', function() {
//                jarves.openFrontend();
//            })
//            .inject(this.mainMenuIconBar);
//
//        this.openSearchIndexBtn = new Element('a', {
//            'class': 'icon-search-8',
//            title: t('Search engine index'),
//            href: 'javascript: ;'
//        })
//            .addEvent('click', function() {
//                jarves.openSearchContext();
//            })
//            .inject(this.mainMenuIconBar);
//
//        this.clearCacheBtn = new Element('a', {
//            'class': 'icon-trashcan-6',
//            title: t('Clear cache'),
//            href: 'javascript: ;'
//        })
//            .addEvent('click', function() {
//                this.clearCache();
//            }.bind(this))
//            .inject(this.mainMenuIconBar);
//
//        this.openHelpBtn = new Element('a', {
//            'class': 'icon-info-5',
//            title: t('Help'),
//            href: 'javascript: ;'
//        })
//            .addEvent('click', function() {
//                jarves.clearCache();
//            })
//            .inject(this.mainMenuIconBar);

        this.appContainer = new Element('div', {
            'class': 'jarves-app-container'
        }).inject(this.border);

        this.wmTabContainer = new Element('div', {
            'class': 'jarves-main-menu-wm-tabs'
        }).inject(this.appContainer)

        if (this.options.frontPage) {
            this.desktopContainer = this.border;

            var y;
            window.addEvent('scroll', function() {
                if ((y = window.getScroll().y) > 0) {
                    this.mainMenu.setStyle('top', y);
                } else {
                    this.mainMenu.setStyle('top', 0);
                }
            }.bind(this));
        } else {
            this.desktopContainer = new Element('div', {
                'class': 'jarves-desktop jarves-admin jarves-scrolling'
            }).inject(this.appContainer);
        }

        //this.setupMainLinksDragger();
    },

    getAppContainer: function() {
        return this.appContainer;
    },

    getWMTabContainer: function() {
        return this.wmTabContainer;
    },

    isFrontPage: function() {
        return this.options.frontPage;
    },

    clearCache: function() {
        if (!this.cacheToolTip) {
            this.cacheToolTip = new jarves.Tooltip(this.clearCacheBtn, t('Clearing cache ...'), 'top');
        }
        this.cacheToolTip.show();

        new Request.JSON({url: _pathAdmin + 'admin/backend/cache', noCache: 1, onComplete: function(res) {
            this.cacheToolTip.stop(t('Cache cleared'));
        }.bind(this)}).post({_method: 'delete'});
    },

    /*
     * Build the administration interface after login
     */
    renderBackend: function() {
        if (this.options.frontPage) {
            return;
        }
        this.createLayout();

        this.border.setStyles({'display': 'block'});
        this.mainMenuUser.empty();

        new Element('h2', {
            text: tf('%s %s', window._session.firstName, window._session.lastName)
        }).inject(this.mainMenuUser);

        var profilePictureUrl;
        if (window._session.imagePath) {
            profilePictureUrl = _path + window._session.imagePath.substr(1);
        } else if (window._session.emailMd5) {
            profilePictureUrl = 'https://secure.gravatar.com/avatar/' + window._session.emailMd5;
        }

        if (profilePictureUrl) {
            new Element('img', {
                'class': 'profile-image',
                src: profilePictureUrl
            }).inject(this.mainMenuUser);
        }

        new Element('br').inject(this.mainMenuUser);

        new Element('span', {
            text: window._session.username,
            'class': 'username'
        })
            .addEvent('click', function() {
                jarves.wm.open('users/users/editMe', {values: {id: window._userId}});
            })
            .inject(this.mainMenuUser);

        this.logoutButton = new jarves.Button(t('Logout'))
            .addEvent('click', function() {
                this.logout();
            }.bind(this))
            .inject(this.mainMenuUser);

        if (!this.helpsystem) {
            this.helpsystem = new jarves.Helpsystem(document.body);
        }

        if (this._iconSessionCounterDiv) {
            this._iconSessionCounterDiv.destroy();
        }

//        this._iconSessionCounterDiv = new Element('div', {
//            'class': 'jarves-iconbar-item',
//            title: t('Visitors')
//        }).inject(this.mainMenuRight);

//        this._iconSessionCounter = new Element('a', {'class': 'icon-users', text: 0}).inject(this._iconSessionCounterDiv);

//        if (!this.searchContainer) {
//            this.searchContainer = new Element('div', {
//                'class': 'jarves-iconbar-item jarves-search'
//            }).inject(this.mainMenuRight);
//
//            this.searchInput = new jarves.Field({
//                type: 'text',
//                noWrapper: true
//            }, this.searchContainer);
//
//            document.id(this.searchInput).addClass('jarves-search-input');
//
//            this.searchInput.addEvent('change', function() {
//                if (this.searchInput.getValue() != '') {
//                    this.doMiniSearch(this.searchInput.getValue());
//                } else {
//                    this.hideMiniSearch();
//                }
//            }.bind(this));
//
//            this.searchIcon = new Element('img', {
//                'class': 'jarves-search-query-icon',
//                src: 'bundles/jarves/admin/images/icon-search-loupe.png'
//            }).inject(this.searchContainer);
//        }

        window.fireEvent('init');

        jarves.loadStream();

        window.onbeforeunload = function(evt) {

            if (jarves.wm.getWindowsCount() > 0) {
                var message = _('There are open windows. Are you sure you want to leave the administration?');
                if (typeof evt == 'undefined') {
                    evt = window.event;
                }
                if (evt) {
                    evt.returnValue = message;
                }
                return message;
            }
        };

        window.addEvent('mouseup', function() {
            this.destroyLinkContext();
        }.bind(this));

        //        window.addEvent('stream', function (res) {
        //            document.id('serverTime').set('html', res.time);
        //            this._iconSessionCounter.set('text', res.sessions_count);
        //        });
        //
        //        window.addEvent('stream', function (res) {
        //            if (res.corruptJson) {
        //                Array.each(res.corruptJson, function (item) {
        //                    this.helpsystem.newBubble(t('Extension config Syntax Error'), _('There is an error in your inc/module/%s/config.json').replace('%s', item), 4000);
        //                }.bind(this));
        //            }
        //        });

        jarves.wm.handleHashtag();

        if (!window.location.hash) {
            this.openDashboard();
        }
        jarves.wm.updateWindowBar();
    },

    /**
     *
     * @returns {jarves.Helpsystem}
     */
    getHelpSystem: function() {
        return this.helpsystem;
    },

    toggleMainbar: function() {
        if (this.border.getStyle('top').toInt() != 0) {
            this.border.tween('top', 0);
            document.id('arrowUp').setStyle('background-color', 'transparent');
            document.id('arrowUp').morph({
                'top': 0,
                left: 0
            });
        } else {
            this.border.tween('top', -76);
            document.id('arrowUp').setStyle('background-color', '#399BC7');
            document.id('arrowUp').morph({
                'top': 61,
                left: 32
            });
        }
    },

    doMiniSearch: function() {

        if (!this._miniSearchPane) {

            this._miniSearchPane = new Element('div', {
                'class': 'jarves-mini-search'
            }).inject(this.border);

            this._miniSearchLoader = new Element('div', {
                'class': 'jarves-mini-search-loading'
            }).inject(this._miniSearchPane);
            new Element('img', {
                src: _path + 'bundles/jarves/admin/images/jarves-tooltip-loading.gif'
            }).inject(this._miniSearchLoader);
            new Element('span', {
                html: '<br/>' + t('Searching ...')
            }).inject(this._miniSearchLoader);
            this._miniSearchResults =
                new Element('div', {'class': 'jarves-mini-search-results'}).inject(this._miniSearchPane);

        }

        this._miniSearchLoader.setStyle('display', 'block');
        this._miniSearchResults.set('html', '');

        if (this._lastTimer) {
            clearTimeout(this._lastTimer);
        }
        this._lastTimer = this._miniSearch.delay(500, this);

    },

    _miniSearch: function() {

        new Request.JSON({url: _pathAdmin + 'admin/backend/search', noCache: 1, onComplete: function(pResponse) {
            this._miniSearchLoader.setStyle('display', 'none');
            this._renderMiniSearchResults(pResponse.data);
        }.bind(this)}).get({q: this.searchInput.getValue(), lang: window._session.lang});

    },

    _renderMiniSearchResults: function(pRes) {

        this._miniSearchResults.empty();

        if (typeOf(pRes) == 'object') {

            Object.each(pRes, function(subresults, subtitle) {
                var subBox = new Element('div').inject(this._miniSearchResults);

                new Element('h3', {
                    text: subtitle
                }).inject(subBox);

                var ol = new Element('ul').inject(subBox);
                Array.each(subresults, function(subsubresults, index) {
                    var li = new Element('li').inject(ol);
                    new Element('a', {
                        html: ' ' + subsubresults[0],
                        href: 'javascript: ;'
                    }).addEvent('click', function() {
                            jarves.wm.open(subsubresults[1], subsubresults[2]);
                            this.hideMiniSearch();
                        }.bind(this)).inject(li);
                }.bind(this));
            }.bind(this));
        } else {
            new Element('span', {html: '<br/>' + t('No results') }).inject(this._miniSearchResults);
        }

    },

    hideMiniSearch: function() {
        if (this._miniSearchPane) {
            this._miniSearchPane.destroy();
            this._miniSearchPane = false;
        }
    },

    prepareLoader: function() {
        this._loader = new Element('div', {
            'class': 'jarves-ai-loader'
        }).setStyle('opacity', 0).set('tween', {duration: 400}).inject(document.body);

        frames['content'].onload = function() {
            this.endLoading();
        };
        frames['content'].onunload = function() {
            this.startLoading();
        };
    },

    endLoading: function() {
        this._loader.tween('opacity', 0);
    },

    getDesktop: function() {
        return this.desktopContainer;
    },

    startLoading: function() {
        var co = this.desktopContainer;
        this._loader.setStyles(co.getCoordinates());
        this._loader.tween('opacity', 1);
    },

    renderLogin: function() {
        this.login = new Element('div', {
            'class': 'jarves-login jarves-admin'
        }).inject(document.body);

        this.middle = new Element('div', {
            'class': 'jarves-login-middle',
            styles: {
                left: 0
            }
        }).inject(this.login);

        this.middle.set('morph', {
            duration: 300,
            transition: Fx.Transitions.Cubic.easeOut
        });

        this.middleTop = new Element('div', {
            'class': 'jarves-login-middle-top'
        }).inject(this.middle);

        new Element('img', {
            'class': 'jarves-login-logo',
            src: _path + 'bundles/jarves/admin/images/logo.png'
        }).inject(this.middleTop);

        var form = new Element('form', {
            id: 'loginForm',
            'class': 'jarves-login-middle-form',
            action: './admin',
            method: 'post'
        }).addEvent('submit',
            function(e) {
                e.stop()
            }).inject(this.middle);
        this.loginForm = form;

        this.loginName = new Element('input', {
            name: 'loginName',
            'class': 'jarves-Input-text',
            type: 'text',
            placeholder: t('Username')
        })
            .addEvent('keyup', function(e) {
                if (e.key == 'enter') {
                    this.doLogin();
                }
            }.bind(this)).inject(form);

        this.loginPw = new Element('input', {
            name: 'loginPw',
            type: 'password',
            'class': 'jarves-Input-text',
            placeholder: t('Password')
        }).addEvent('keyup', function(e) {
                if (e.key == 'enter') {
                    this.doLogin();
                }
            }.bind(this)).inject(form);

        this.loginLangSelection = new jarves.Select();
        this.loginLangSelection.inject(form);

        this.loginLangSelection.addEvent('change',function() {
            this.loadLanguage(this.loginLangSelection.getValue());
            this.reloadLogin();
        }).inject(form);

        Object.each(jarves.possibleLangs, function(lang) {
            this.loginLangSelection.add(lang.code, lang.title + ' (' + lang.langtitle + ')');
        }.bind(this));

        var ori = this.loginLangSelection.getValue();

        if (window._session.lang) {
            this.loginLangSelection.setValue(window._session.lang);
        }

        this.loginMessage = new Element('div', {
            'class': 'loginMessage'
        }).inject(this.middle);

        this.loginBtn = new jarves.Button(t('Login')).inject(form);
        this.loginBtn.setButtonStyle('blue');
        this.loginBtn.addEvent('click', function() {
            this.doLogin();
        }.bind(this));

        this.loaderTop = new Element('div', {
            'class': 'jarves-login-loader-top'
        }).inject(form);

        this.loaderTopLine = new Element('div', {
            'class': 'jarves-ai-loginLoadingBarInside'
        }).inject(this.loaderTop);

        this.loaderTopLine.set('tween', {
            duration: 5000,
            transition: Fx.Transitions.Expo.easeOut
        });

        this.loaderBottom = new Element('div', {
            'class': 'jarves-login-loader-bottom'
        }).inject(form);

        [this.loaderTop, this.loaderBottom].each(function(item) {
            item.set('morph', {duration: 300, transition: Fx.Transitions.Quart.easeInOut});
        });

        var combatMsg = false;
        var fullBlock = Browser.ie && Browser.version == '6.0';

        //check browser compatibility
        //if (!Browser.Plugins.Flash.version){
        //todo
        //}

        if (combatMsg || fullBlock) {
            this.loginBarrierTape = new Element('div', {
                'class': 'jarves-login-barrierTape'
            }).inject(this.login);

            this.loginBarrierTapeContainer = new Element('div').inject(this.loginBarrierTape);
            var table = new Element('table', {
                width: '100%'
            }).inject(this.loginBarrierTapeContainer);
            var tbody = new Element('tbody').inject(table);
            var tr = new Element('tr').inject(tbody);
            this.loginBarrierTapeText = new Element('td', {
                valign: 'middle',
                text: combatMsg,
                style: 'height: 55px;'
            }).inject(tr);
        }

        //if IE6
        if (fullBlock) {
            this.loginBarrierTape.addClass('jarves-login-barrierTape-fullblock');
            this.loginBarrierTapeText.set('text',
                t('Holy crap. You really use Internet Explorer 6? You can not enjoy the future with this - stay out.'));
            new Element('div', {
                'class': 'jarves-login-barrierTapeFullBlockOverlay',
                styles: {
                    opacity: 0.01
                }
            }).inject(this.login);
        }

        if (!Cookie.read('jarves_language')) {
            var possibleLanguage = navigator.browserLanguage || navigator.language;
            if (possibleLanguage.indexOf('-')) {
                possibleLanguage = possibleLanguage.substr(0, possibleLanguage.indexOf('-'));
            }

            if (jarves.possibleLangs[possibleLanguage]) {

                this.loginLangSelection.setValue(possibleLanguage);
                if (this.loginLangSelection.getValue() != window._session.lang) {
                    jarves.loadLanguage(this.loginLangSelection.getValue());
                    this.reloadLogin();
                    return;
                }
            }
        }

        jarves.loadLanguage(this.loginLangSelection.getValue());

        if (parent.inChrome && parent.inChrome()) {
            parent.doLogin();
        } else {
            if (_session.userId > 0) {
                if (window._session.noAdminAccess) {
                    this.loginFailed();
                } else {
                    this.loginSuccess(_session, true);
                }
            }
        }

        this.loginName.focus();
    },

    reloadLogin: function() {
        if (this.login) {
            this.login.destroy();
        }
        this.renderLogin();
    },

    doLogin: function() {
        (function() {
            document.activeElement.blur();
        }).delay(10, this);
        this.blockLoginForm();
        this.loginMessage.set('html', t('Check Login. Please wait ...'));
        if (this.loginFailedClearer) {
            clearTimeout(this.loginFailedClearer);
        }
        new Request.JSON({url: _pathAdmin + 'admin/login', noCache: 1, onComplete: function(res) {
            if (res.data) {
                this.loginSuccess(res.data);
            } else {
                this.loginFailed();
                this.unblockLoginForm();
            }
        }.bind(this)}).post({username: this.loginName.value, password: this.loginPw.value});
    },

    logout: function() {
        if (this.loaderCon) {
            this.loaderCon.destroy();
        }

        this.loginPw.value = '';

        window.fireEvent('logout');

        jarves.wm.closeAll();
        new Request({url: _pathAdmin + 'admin/logout', noCache: 1}).post();

        this.border.destroy();

        if (this.loader) {
            this.loader.destroy();
        }

        this.loginMessage.set('html', '');
        this.login.setStyle('display', 'block');

        this.loginFx.start({
            0: { //middle
                marginTop: 200,
                left: 0,
                width: 325,
                height: 280
            },
            1: { //middleTop
                marginLeft: 0
            },
            2: { //loginForm
                opacity: 1
            },
            3: { //loginLoadingBarText
                opacity: 1
            }

        }).chain(function() {
                this.unblockLoginForm();
                this.loginPw.focus();

                this.middle.setStyle('border', '5px solid #ffffff');
                this.middle.setStyle('height');
            }.bind(this));

        [this.loginMessage]
            .each(function(i) {
                document.id(i).setStyle('display', 'block')
            });

        this.loginPw.value = '';
        window._session.userId = 0;
    },

    loginSuccess: function(sessions, pAlready) {
        (function() {
            document.activeElement.blur();
        }).delay(10, this);

        if (pAlready && window._session.hasBackendAccess == '0') {
            return;
        }

        window._session = sessions;

        this.loginName.value = window._session.username;

        this.loginMessage.set('html', t('Please wait'));
        if (!window._session.access){
            this.loginMessage.set('html', t('Access denied.'));
            this.unblockLoginForm();
        } else {
            this.loadBackend(pAlready);
        }
    },

    loginFailed: function() {
        this.loginPw.focus();
        this.loginMessage.set('html', '<span style="color: red">' + _('Login failed') + '.</span>');
        this.loginFailedClearer = (function() {
            this.loginMessage.set('html', '');
        }).delay(3000, this);
    },

    blockLoginForm: function(pAlready) {
        if (pAlready) {
            this.loaderTop.setStyles({'height': 91, 'border-bottom': '1px solid #ffffff'});
            this.loaderBottom.setStyles({'height': 92, 'border-top': '1px solid #ffffff'});
        } else {
            this.loaderTop.morph({'height': 91, 'border-bottom': '1px solid #ffffff'});
            this.loaderBottom.morph({'height': 92, 'border-top': '1px solid #ffffff'});
        }
    },

    unblockLoginForm: function() {
        this.loaderTop.morph({'height': 0, 'border-bottom': '0px solid #ffffff'});
        this.loaderBottom.morph({'height': 0, 'border-top': '0px solid #ffffff'});
        (function(){
            this.loginPw.focus();
        }.bind(this)).delay(200);
    },

    loadSettings: function(keyLimitation, cb) {
        if (!jarves.settings) {
            jarves.settings = {};
        }

        new Request.JSON({url: _pathAdmin +
            'admin/backend/settings', noCache: 1, async: false, onComplete: function(res) {
            if (res.error == 'access_denied') {
                return;
            }

            Object.each(res.data, function(val, key) {
                jarves.settings[key] = val;
            });

            jarves.settings['images'] = ['jpg', 'jpeg', 'bmp', 'png', 'gif', 'psd'];

            if (!jarves.settings.user) {
                jarves.settings.user = {};
            }

            if (typeOf(jarves.settings.user) != 'object') {
                jarves.settings.user = {};
            }

            if (!jarves.settings['user']['windows']) {
                jarves.settings['user']['windows'] = {};
            }

            if (!this.options.frontPage && jarves.settings.system && jarves.settings.system.systemTitle) {
                document.title = jarves.settings.system.systemTitle + t(' | Jarves cms Administration');
            }

            jarves.settings.configsAlias = {};
            Object.each(jarves.settings.configs, function(config, key){
                jarves.settings.configsAlias[key.toLowerCase()] = jarves.settings.configs[key];
                jarves.settings.configsAlias[key.toLowerCase().replace(/bundle$/, '')] = jarves.settings.configs[key];
            });

            if (cb) {
                cb(res.data);
            }
        }.bind(this)}).get({lang: window._session.lang, keys: keyLimitation});
    },

    loadBackend: function(pAlready) {
        if (this.alreadyLoaded) {
            this.loadDone();
            return;
        }

        [this.loginMessage]
            .each(function(i) {
                document.id(i).setStyle('display', 'none')
            });

        this.loginLoadingBarText = new Element('div', {
            'class': 'jarves-ai-loginLoadingBarText',
            html: _('Loading your interface')
        }).inject(this.loginForm, 'after');

        this.blockLoginForm(pAlready);
        var self = this;

        if (this.options.frontPage) {
            this.loadSettings();
        } else {
            this.loadSettings(null, function() {
                self.loaderTopLine.tween('width', 255);

                self.loadMenu(function() {
                    self.loaderTopLine.set('tween', {duration: 200});
                    self.loaderTopLine.tween('width', 395);
                    self.loadDone.delay(200, self);
                    self.loginLoadingBarText.set('html', t('Loading done'));
                });
            });
        }
    },

    loadDone: function() {
        this.check4Updates.delay(2000, this);

        this.allFilesLoaded = true;

        var self = this;

        this.loaderTopLine.setStyle('display', 'none');
        this.loginLoadingBarText.setStyle('display', 'none');

        this.loginFx = new Fx.Elements([
            this.middle,
            this.middleTop,
            this.loginForm
        ], {
            duration: 350,
            transition: Fx.Transitions.Cubic.easeOut
        });

        this.middle.setStyle('border', '0px solid #ffffff');

        this.loginFx.start({
            0: { //middle
                marginTop: 0,
                left: 0,
                width: window.getSize().x,
                height: window.getSize().y
            },
            1: { //middleTop
                marginLeft: 0
            },
            2: { //loginForm
                opacity: 0
            }

        }).chain(function() {
                self.loginLoadingBarText.set('html');

                //load settings, bg etc
                self.renderBackend();
                self.login.setStyle('display', 'none');
                self.border.setStyle('display', 'block');
                self.loaderTopLine.setStyle('display', 'block');
                this.loginLoadingBarText.setStyle('display', 'block');

                self.loaderTopLine.setStyle('width', 0);

                var lastLogin = new Date();
                if (window._session.lastlogin > 0) {
                    lastLogin = new Date(window._session.lastlogin * 1000);
                }
                if (self.helpsystem) {
                    self.helpsystem.newBubble(
                        t('Welcome back, %s').replace('%s', window._session.username),
                        t('Your last login was %s').replace('%s', lastLogin.format('%d. %b %I:%M')),
                        3000);
                }

            }.bind(this));
        //});
    },

    toggleModuleMenuIn: function(pOnlyStay) {
        if (this.lastModuleMenuOutTimer) {
            clearTimeout(this.lastModuleMenuOutTimer);
        }

        if (this.ModuleMenuOutOpen == true) {
            return;
        }

        if (pOnlyStay == true) {
            return;
        }

        this.ModuleMenuOutOpen = false;
        this._moduleMenu.set('tween', {transition: Fx.Transitions.Quart.easeOut, onComplete: function() {
            this.ModuleMenuOutOpen = true;
        }});
        this._moduleMenu.tween('left', 0);
        this.moduleToggler.store('active', true);
        this.moduleItems.setStyle('right', 0);
        //this.moduleItemsScroller.setStyle('left', 188);
        //this.moduleItemsScrollerContainer.setStyle('right', 0);
    },

    toggleModuleMenuOut: function(pForce) {

        //if( !this.ModuleMenuOutOpen && pForce != true )
        //	return;

        if (this.lastModuleMenuOutTimer) {
            clearTimeout(this.lastModuleMenuOutTimer);
        }

        this.ModuleMenuOutOpen = false;

        this.lastModuleMenuOutTimer = (function() {
            this._moduleMenu.set('tween', {transition: Fx.Transitions.Quart.easeOut, onComplete: function() {
                this.ModuleMenuOutOpen = false;
            }});
            this._moduleMenu.tween('left', (this._moduleMenu.getSize().x - 33) * -1);
            this.moduleToggler.store('active', false);
            this.moduleItems.setStyle('right', 40);
            //this.moduleItemsScrollerContainer.setStyle('right', 50);
            this.destroyLinkContext();
        }).delay(300, this);

    },

    toggleModuleMenu: function() {
        if (this.moduleToggler.retrieve('active') != true) {
            this.toggleModuleMenuIn();
        } else {
            this.toggleModuleMenuOut();
        }
    },

    loadMenu: function(cb) {
        if (this.lastLoadMenuReq) {
            this.lastLoadMenuReq.cancel();
        }

        this.lastLoadMenuReq =
            new Request.JSON({url: _pathAdmin + 'admin/backend/menus', noCache: true, onComplete: function(res) {
                this.menuItems = res.data;
                if (cb) {
                    cb(res.data);
                }
            }.bind(this)}).get();
    },

    renderMenu: function() {
        return;

        this.mainLinks.empty();

        if (this.additionalMainMenu) {
            this.additionalMainMenu.destroy();
            this.additionalMainMenuContainer.destroy();
            delete this.additionalMainMenu;
        }

        this.removedMainMenuItems = [];
        delete this.mainMenuItems;

        Object.each(this.menuItems, function(item, path) {
            this.addAdminLink(item, path);
        }.bind(this));

        jarves.wm.handleHashtag();
        jarves.wm.updateWindowBar();
    },

    showDashboard: function(show) {
        if (this.dashboardVisible !== show) {
            if (show) {
                this.dashboardInstance = new jarves.Dashboard(this.desktopContainer);
                new Element('h1', {
                    text: t('Dashboard'),
                    style: 'margin: 5px 7px; color: #444;'
                }).inject(this.getWMTabContainer());
            } else if (this.dashboardInstance) {
                this.dashboardInstance.destroy();
                delete this.dashboardInstance;
            }

            this.dashboardVisible = show;
        }

    },

    makeMenu: function(pToggler, pMenu, pCalPosition, pOffset) {

        pMenu.setStyle('display', 'none');

        var showMenu = function() {
            pMenu.setStyle('display', 'block');
            pMenu.store('this.makeMenu.canHide', false);

            if (pCalPosition) {
                var pos = pToggler.getPosition(this.border);
                if (pOffset) {
                    if (pOffset.x) {
                        pos.x += pOffset.x;
                    }
                    if (pOffset.y) {
                        pos.y += pOffset.y;
                    }
                }
                pMenu.setStyles({
                    'left': pos.x,
                    'top': pos.y
                });
            }
        };

        var _hideMenu = function() {
            if (pMenu.retrieve('this.makeMenu.canHide') != true) {
                return;
            }
            pMenu.setStyle('display', 'none');
        };

        var hideMenu = function() {
            pMenu.store('this.makeMenu.canHide', true);
            _hideMenu.delay(250);
        };

        pToggler.addEvent('mouseover', showMenu);
        pToggler.addEvent('mouseout', hideMenu);
        pMenu.addEvent('mouseover', showMenu);
        pMenu.addEvent('mouseout', hideMenu);

        //this.additionalMainMenu, this.additionalMainMenuContainer, true, {y: 80});
    },

//    addAdminHeadline: function(pExtKey) {
//        var config = jarves.getConfig(pExtKey);
//        if (config) {
//
//            new Element('div', {
//                'class': 'jarves-main-menu-splitter'
//            }).inject(this.mainLinks);
//
//            new Element('h2', {
//                'class': 'jarves-main-menu-headline',
//                text: config.title,
//                title: config.desc ? config.desc : ''
//            }).inject(this.mainLinks);
//        }
//    },

    addTempLink: function(pWin) {
        var entryPoint = pWin.getEntryPointDefinition();

        var mlink = new Element('a', {
            text: entryPoint.label + ' » ' + pWin.getTitle(),
            'class': 'jarves-main-menu-item'
        }).inject(this.mainTempLinks);

        var entryPoint = pWin.getEntryPointDefinition();

        if (entryPoint.icon) {
            mlink.addClass('jarves-main-menu-item-hasIcon');
            if (entryPoint.icon.substr(0, 1) == '#') {
                mlink.addClass(entryPoint.icon.substr(1));
            } else {
                mlink.addClass('jarves-main-menu-item-hasImageAsIcon');
                new Element('img', {
                    src: _path + entryPoint.icon
                }).inject(mlink, 'top');
            }
        } else {
            mlink.addClass('jarves-main-menu-item-hasNoIcon');
        }

        mlink.activeWindowInformationContainer = new Element('div', {
            'class': 'jarves-main-menu-item-window-information-container'
        }).inject(mlink);

        return mlink;
    },

    addAdminLink: function(entryPoint, path) {
        if (entryPoint.system) {
            return;
        }

        var link = new Element('a', {
            'class': 'jarves-main-menu-item'
        });
        new Element('span', {
            text: entryPoint.label
        }).inject(link);
        var module = entryPoint.fullPath.split('/')[0];

        if ('admin/dashboard' === path) {
            this.dashboardLink = link;
        }

        if (this.lastAddedAdminLinkModule && this.lastAddedAdminLinkModule != module) {
            var splitter = new Element('div', {
                'class': 'jarves-main-menu-splitter'
            }).inject(this.mainLinks);
            if (jarves.getConfig(module)) {
                new Element('h2', {
                    'class': 'jarves-main-menu-title',
                    text: jarves.getConfig(module).label || jarves.getConfig(module).name
                }).inject(this.mainLinks);
            }
        }

        this.lastAddedAdminLinkModule = module;

        link.activeWindowInformationContainer = new Element('div', {
            'class': 'jarves-main-menu-item-window-information-container'
        }).inject(link);

        if (entryPoint.icon) {
            link.addClass('jarves-main-menu-item-hasIcon');
            if (entryPoint.icon.substr(0, 1) == '#') {
                link.addClass(entryPoint.icon.substr(1));
            } else {
                link.addClass('jarves-main-menu-item-hasImageAsIcon');
                new Element('img', {
                    src: _path + entryPoint.icon
                }).inject(link, 'top');
            }
        } else {
            link.addClass('jarves-main-menu-item-hasNoIcon');
        }

        link.activeWindowInformationContainer = new Element('div', {
            'class': 'jarves-main-menu-item-window-information-container'
        }).inject(link);

        this._links[path] = {
            level: 'main',
            object: link,
            link: entryPoint,
            path: path,
            title: entryPoint.title
        };

        if (1 == entryPoint.level) {
            if ('admin' === module && 0 !== entryPoint.fullPath.indexOf('admin/system')) {
                link.inject(this.mainMenuTopNavigation);
            } else {
                link.inject(this.mainLinks);

                link.subMenu = new Element('div', {
                    'class': 'jarves-menu-item-children'
                }).inject(this.mainLinks);
            }
        } else {
            var parentCode = path.substr(0, path.lastIndexOf('/'));
            var parent = this._links[parentCode];
            if (parent) {
                parent = parent.object;
                link.inject(parent.subMenu);

                if (!parent.hasClass('jarves-menu-item-hasChilds')) {
                    parent.addClass('jarves-menu-item-hasChilds');

                    var childOpener = new Element('a', {
                        'class': 'jarves-menu-item-childopener'
                    }).inject(parent);

                    new Element('img', {
                        src: _path + 'bundles/jarves/admin/images/jarves-mainmenu-item-tree_minus.png'
                    }).inject(childOpener);

                    childOpener.addEvent('click', function(e) {
                        e.stop();
                        if ('block' !== parent.subMenu.getStyle('display')) {
                            parent.subMenu.setStyle('display', 'block');
                        } else {
                            parent.subMenu.setStyle('display', 'none');
                        }
                    });
                }
            }
        }
        link.store('entryPoint', entryPoint);
        this.linkClick(link);
    },

    getMenuItem: function(pEntryPoint) {
        return this._links[pEntryPoint];
    },

    destroyLinkContext: function() {

        if (this._lastLinkContextDiv) {
            this._lastLinkContextDiv.destroy();
            this._lastLinkContextDiv = null;
        }

    },

    linkClick: function(link) {
        var entryPoint = link.retrieve('entryPoint');

        if (['iframe', 'list', 'combine', 'custom', 'add', 'edit'].indexOf(entryPoint.type) != -1) {

            var item = this._links[entryPoint.fullPath];
            var link = item.object;

            link.addEvent('click', function(e) {
                this.destroyLinkContext();

                if (e.rightClick) {
                    return;
                }
                e.stopPropagation();
                e.stop();

                var windows = [];
                Object.each(jarves.wm.windows, function(pwindow) {
                    if (!pwindow) {
                        return;
                    }
                    if (pwindow.code == entryPoint.code && pwindow.module == entryPoint.module) {
                        windows.include(pwindow);
                    }
                }.bind(this));

                if (windows.length == 0) {
                    //none exists, just open
                    jarves.wm.open(entryPoint.fullPath);
                } else if (windows.length == 1) {
                    //only one is open, bring it to front
                    windows[0].toFront();
                } else if (windows.length > 1) {
                    //open contextmenu
                    e.stopPropagation();
                    e.stop();
                    this._openLinkContext(link);
                }

                delete windows;
            }.bind(this));

            link.addEvent('mouseup', function(e) {

                if (e.rightClick) {
                    e.stopPropagation();
                    this._openLinkContext(link);
                }
            }.bind(this));
        }
    },

    _openLinkContext: function(pLink) {

        if (this._lastLinkContextDiv) {
            this._lastLinkContextDiv.destroy();
            this._lastLinkContextDiv = null;
        }

        var pos = {x: 0, y: 0};
        var corner = false;

        var parent = pLink.object.getParent('.jarves-module-menu');
        if (!parent) {
            parent = document.body;
        }
        var div = new Element('div', {
            'class': 'jarves-linkcontext-main jarves-linkcontext-sub'
        }).inject(parent);

        corner = new Element('div', {
            'class': 'jarves-tooltip-corner-top',
            style: 'height: 15px; width: 30px;'
        }).inject(div);

        pos = pLink.object.getPosition(pLink.object.getParent('.jarves-module-menu'));
        var size = pLink.object.getSize();

        div.setStyle('left', pos.x);
        div.setStyle('top', pos.y + size.y);
        if (pLink.level == 'main') {

            corner.setStyle('bottom', 'auto');
            corner.setStyle('top', -8);
        }

        this._lastLinkContextDiv = div;

        var windows = [];
        Object.each(jarves.wm.windows, function(pwindow) {
            if (!pwindow) {
                return;
            }
            if (pwindow.code == pLink.code && pwindow.module == pLink.module) {
                windows.include(pwindow);
            }
        }.bind(this));

        var opener = new Element('a', {
            text: _('Open new %s').replace('%s', "'" + pLink.title + "'"),
            'class': 'jarves-linkcontext-opener'
        }).addEvent('click',
            function() {
                jarves.wm.openWindow(pLink.module + '/' + pLink.code);
                this._lastLinkContextDiv.destroy();
            }).inject(div);

        if (windows.length == 0) {
            opener.addClass('jarves-linkcontext-last');
        }

        var lastItem = false;
        windows.each(function(window) {
            lastItem = new Element('a', {
                text: '#' + window.id + ' ' + window.getTitle()
            }).addEvent('click',
                function() {
                    window.toFront();
                    this._lastLinkContextDiv.destroy();
                }).inject(div);
        });

        if (pLink.level == 'sub') {
            var bsize = div.getSize();
            var wsize = window.getSize();
            var mtop = div.getPosition(document.body).y;

            if (mtop + bsize.y > wsize.y) {
                mtop = pos.y - bsize.y;
                div.setStyle('top', mtop);
                corner.set('class', 'jarves-tooltip-corner');
                corner.setStyle('bottom', '-15px');
            } else {
                corner.setStyle('top', '-7px');
            }
            if (lastItem) {
                lastItem.addClass('jarves-linkcontext-last');
            }
        }

        delete windows;

    },

    startSearchCrawlerInfo: function(pHtml) {
        this.stopSearchCrawlerInfo();

        this.startSearchCrawlerInfoMenu = new Element('div', {
            'class': 'jarves-updates-menu',
            style: 'left: 170px; width: 177px;'
        }).inject(this.border);

        this.startSearchCrawlerInfoMenuHtml = new Element('div', {
            html: pHtml
        }).inject(this.startSearchCrawlerInfoMenu);

        this.startSearchCrawlerProgressLine = new Element('div', {
            style: 'position: absolute; bottom: 1px; left: 4px; width: 0px; height: 1px; background-color: #444;'
        }).inject(this.startSearchCrawlerInfoMenu);

        this.startSearchCrawlerInfoMenu.tween('top', 48);
    },

    setSearchCrawlerInfo: function(pHtml) {
        this.startSearchCrawlerInfoMenuHtml.set('html', pHtml);
    },

    stopSearchCrawlerInfo: function(pOutroText) {
        if (!this.startSearchCrawlerInfoMenu) {
            return;
        }

        var doOut = function() {
            this.startSearchCrawlerInfoMenu.tween('top', 17);
        }.bind(this);

        if (pOutroText) {
            this.startSearchCrawlerInfoMenuHtml.set('html', pOutroText);
            doOut.delay(2000);
        } else {
            doOut.call();
        }

    },

    setSearchCrawlerProgress: function(pPos) {
        var maxLength = 177 - 8;
        var pos = maxLength * pPos / 100;
        this.startSearchCrawlerProgressLine.set('tween', {duration: 100});
        this.startSearchCrawlerProgressLine.tween('width', pos);
    },

    stopSearchCrawlerProgres: function() {
        this.startSearchCrawlerProgressLine.set('tween', {duration: 10});
        this.startSearchCrawlerProgressLine.tween('width', 0);
    },

    openSearchContextClose: function() {
        if (this.openSearchContextLast) {
            this.openSearchContextLast.destroy();
        }

    },

    openSearchContext: function() {
        var button = this.openSearchIndexBtn;

        this.openSearchContextClose();

        this.openSearchContextLast = new Element('div', {
            'class': 'jarves-searchcontext'
        }).inject(this.border);

        var pos = button.getPosition(this.border);
        var size = this.border.getSize();
        var right = size.x - pos.x;

        this.openSearchContextLast.setStyle('right', right - 30);

        new Element('img', {
            'class': 'jarves-searchcontext-arrow',
            src: _path + 'bundles/jarves/admin/images/jarves-tooltip-corner-top.png'
        }).inject(this.openSearchContextLast);

        this.openSearchContextContent = new Element('div', {
            'class': 'jarves-searchcontext-content'
        }).inject(this.openSearchContextLast);

        this.openSearchContextBottom = new Element('div', {
            'class': 'jarves-searchcontext-bottom'
        }).inject(this.openSearchContextLast);

        new jarves.Button(t('Indexed pages')).addEvent('click',
            function() {
                jarves.wm.open('jarvesbundle/system/searchIndexerList');
            }).inject(this.openSearchContextBottom);

        this.openSearchContextClearIndex = new jarves.Button(_('Clear index')).addEvent('click',
            function() {
                this.openSearchContextClearIndex.startTip(_('Clearing index ...'));

                new Request.JSON({url: _pathAdmin +
                    'admin/backend/searchIndexer/clearIndex', noCache: 1, onComplete: function(pRes) {
                    this.openSearchContextClearIndex.stopTip(_('Done'));
                }.bind(this)}).post();
            }).inject(this.openSearchContextBottom);

        new Element('a', {
            style: 'position: absolute; right: 5px; top: 3px; text-decoration: none; font-size: 13px;',
            text: 'x',
            title: _('Close'),
            href: 'javascript: ;'
        }).addEvent('click', this.openSearchContextClose).inject(this.openSearchContextLast);

        this.openSearchContextLoad();
    },

    openSearchContextLoad: function() {
        this.openSearchContextContent.set('html',
            '<br /><br /><div style="text-align: center; color: gray;">' + _('Loading ...') + '</div>');

        //todo
        this.openSearchContextTable = new jarves.Table([
            [_('Domain'), 190],
            [_('Indexed pages')]
        ]);

        new Request.JSON({url: _pathAdmin + 'admin/backend/searchIndexer/getIndexedPages4AllDomains',
            noCache: 1,
            onComplete: function(pRes) {

                this.openSearchContextContent.empty();

                this.openSearchContextTable.inject(this.openSearchContextContent);

                if (pRes) {
                    pRes.each(function(domain) {
                        this.openSearchContextTable.addRow(
                            [domain.domain + '<span style="color:gray"> (' + domain.lang + ')</span>',
                                domain.indexedcount]);
                    });
                }

            }
        }.bind(this)).post();
    },

    displayNewUpdates: function(pModules) {
        if (this.newUpdatesMenu) {
            this.newUpdatesMenu.destroy();
        }

        var html = _('New updates !');
        /*
         pModules.each(function(item){
         html += item.name+' ('+item.newVersion+')<br />';
         });
         */
        this.newUpdatesMenu = new Element('div', {
            'class': 'jarves-updates-menu',
            html: html
        })/*
         .addEvent('mouseover', function(){
         this.tween('height', this.scrollHeight );
         })
         .addEvent('mouseout', function(){
         this.tween('height', 24 );
         })
         */.addEvent('click',
            function() {
                jarves.wm.open('jarvesbundle/system/module', {updates: 1});
            }).inject(this.border);
        this.newUpdatesMenu.tween('top', 48);
    },

    buildClipboardMenu: function() {
        this.clipboardMenu = new Element('div', {
            'class': 'jarves-clipboard-menu'
        }).inject(this.mainMenu, 'before');
    },

    buildUploadMenu: function() {
        this.uploadMenu = new Element('div', {
            'class': 'jarves-upload-menu',
            styles: {
                height: 22
            }
        }).addEvent('mouseover',
            function() {
                this.tween('height', this.scrollHeight);
            }).addEvent('mouseout',
            function() {
                this.tween('height', 22);
            }).inject(this.mainMenu, 'before');

        this.uploadMenuInfo = new Element('div', {
            'class': 'jarves-upload-menu-info'
        }).inject(this.uploadMenu);
    },

    check4Updates: function() {
        if (window._session.userId == 0) {
            return;
        }
        new Request.JSON({url: _pathAdmin +
            'admin/system/bundle/manager/check-updates', noCache: 1, onComplete: function(res) {
            if (res && res.found) {
                this.displayNewUpdates(res.modules);
            }
            this.check4Updates.delay(10 * (60 * 1000), this);
        }.bind(this)}).get();
    }

});