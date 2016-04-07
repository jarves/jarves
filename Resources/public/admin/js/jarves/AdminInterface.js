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

        document.body.addClass(Modernizr.touch ? 'jarves-touch' : 'jarves-no-touch');

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
                'class': 'jarves-admin jarves-main-dialog-container'
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

//    openApps: function() {
//        if (this.checkLastSystemDialog('apps')) return;
//
//        this.lastSystemDialog = new jarves.SystemDialog(this.getDialogContainer(), {
//            autoClose: true
//        });
//
//
//        this.mainMenuStartButton.addClass('jarves-main-menu-active');
//        this.lastSystemDialog.addEvent('close', function(){
//            this.mainMenuStartButton.removeClass('jarves-main-menu-active');
//        }.bind(this));
//
//
//        this.lastSystemDialog.center();
//    },

    getMenuItems: function() {
        return this.menuItems;
    },

//    openSettings: function() {
//        if (this.checkLastSystemDialog('settings')) return;
//        this.lastSystemDialog = new jarves.SystemDialog(this.getDialogContainer(), {
//            autoClose: true
//        });
//
//        this.btnOpenSystem.addClass('jarves-main-menu-active');
//        this.lastSystemDialog.addEvent('close', function(){
//            this.btnOpenSystem.removeClass('jarves-main-menu-active');
//        }.bind(this));
//
//        var system = new jarves.System(this.lastSystemDialog.getContentContainer(), this.getMenuItems());
//
//        system.addEvent('click', function(){
//            this.lastSystemDialog.close();
//        }.bind(this));
//
//        this.lastSystemDialog.addEvent('closed', function() {
//            this.clearLastSystemDialog();
//        }.bind(this));
//
//        this.lastSystemDialog.center(true);
//    },

    createLayout: function() {
        this.border = new Element('div', {
            'class': 'jarves-frame jarves-admin jarves-white'
        }).inject(document.body);

        this.mainMenuTop = new Element('div', {
            'class': 'jarves-main-menu-left'
        }).inject(this.border);


        this.mainMenuTopLogoContainer = new Element('div', {
            'class': 'jarves-main-menu-logo-container'
        }).inject(this.mainMenuTop);

        this.mainMenuTopLogo = new Element('img', {
            'class': 'jarves-main-menu-left-logo',
            src: _path + 'bundles/jarves/admin/images/logo.png'
        }).inject(this.mainMenuTopLogoContainer);


        // user
        this.mainMenuUser = new Element('div', {
            'class': 'jarves-main-menu-user'
        }).inject(this.mainMenuTop);

        this.mainMenuUserName = new Element('div', {
            'class': 'jarves-main-menu-user-name'
        }).inject(this.mainMenuUser);



        // actions
        this.mainMenuActions = new Element('div', {
            'class': 'jarves-main-menu-actions'
        }).inject(this.mainMenuTop);

        this.mainMenuSearchInput = new Element('input', {
            'class': 'jarves-Input-text jarves-main-menu-actions-search-input'
        }).inject(this.mainMenuActions);

        this.mainMenuActionsLinks = new Element('div', {
            'class': 'jarves-main-menu-actions-links'
        }).inject(this.mainMenuActions);

        this.mainMenuActionsSearchBtn = new Element('a', {
            text: 'Search'
        }).inject(this.mainMenuActionsLinks);

        this.mainMenuActionsCacheBtn = new Element('a', {
            text: 'Wipe Cache'
        }).inject(this.mainMenuActionsLinks);

        this.mainMenuActionsLogoutBtn = new Element('a', {
            text: 'Logout'
        })
            .addEvent('click', function(){this.logout()}.bind(this))
            .inject(this.mainMenuActionsLinks);


        // actual menu
        this.mainMenuContainer = new Element('div', {
            'class': 'jarves-main-menu jarves-scrolling'
        }).inject(this.mainMenuTop);

        this.mainMenuBottom = new Element('div', {
            'class': 'jarves-main-menu-bottom'
        }).inject(this.mainMenuTop);

        this.mainMenuBottomCollapse = new Element('a', {
            'class': 'jarves-main-menu-bottom-collapse',
            text: t('Collapse')
        }).inject(this.mainMenuBottom);

        new Element('span', {
            'class': 'icon-arrow-left-5'
        }).inject(this.mainMenuBottomCollapse);

        this.appContainer = new Element('div', {
            'class': 'jarves-app-container'
        }).inject(this.border);

//        if (this.options.frontPage) {
//            this.desktopContainer = this.border;
//
//            var y;
//            window.addEvent('scroll', function() {
//                if ((y = window.getScroll().y) > 0) {
//                    this.mainMenu.setStyle('top', y);
//                } else {
//                    this.mainMenu.setStyle('top', 0);
//                }
//            }.bind(this));
//        } else {
            this.desktopContainer = new Element('div', {
                'class': 'jarves-desktop jarves-admin'
            }).inject(this.appContainer);
//        }

        this.wmTabContainer = new Element('div', {
            'class': 'jarves-main-menu-wm-tabs'
        }).inject(this.appContainer);

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
        this.renderMenu();

        this.border.setStyles({'display': 'block'});
        this.mainMenuUserName.set('text', tf('Welcome, %s %s', window._session.firstName, window._session.lastName));

//        var profilePictureUrl;
//        if (window._session.imagePath) {
//            profilePictureUrl = _path + window._session.imagePath.substr(1);
//        } else if (window._session.emailMd5) {
//            profilePictureUrl = 'https://secure.gravatar.com/avatar/' + window._session.emailMd5;
//        }
//
//        if (profilePictureUrl) {
//            new Element('img', {
//                'class': 'profile-image',
//                src: profilePictureUrl
//            }).inject(this.mainMenuUser);
//        }
//
//        new Element('br').inject(this.mainMenuUser);

//        new Element('span', {
//            text: window._session.username,
//            'class': 'username'
//        })
//            .addEvent('click', function() {
//                jarves.wm.open('users/users/editMe', {values: {id: window._userId}});
//            })
//            .inject(this.mainMenuUser);

//
//        this.logoutButton = new jarves.Button(t('Logout'))
//            .addEvent('click', function() {
//                this.logout();
//            }.bind(this))
//            .inject(this.mainMenuUser);

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
//            this.openDashboard();
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
            jarves.loadLanguage(this.loginLangSelection.getValue());
            this.reloadLogin();
        }.bind(this)).inject(form);

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

        new Request.JSON({url: _pathAdmin + 'admin/login', noCache: 1,
            onException: function(){
                this.loginFailed();
                this.unblockLoginForm();
            }.bind(this),
            onComplete: function(res) {
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
            this.loaderTop.setStyles({'height': 91, 'border-bottom': '1px solid #868686'});
            this.loaderBottom.setStyles({'height': 92, 'border-top': '1px solid #868686'});
        } else {
            this.loaderTop.morph({'height': 91, 'border-bottom': '1px solid #868686'});
            this.loaderBottom.morph({'height': 92, 'border-top': '1px solid #868686'});
        }
    },

    unblockLoginForm: function() {
        this.loaderTop.morph({'height': 0, 'border-bottom': '0px solid #ddddd'});
        this.loaderBottom.morph({'height': 0, 'border-top': '0px solid #ddddd'});
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
                document.title = jarves.settings.system.systemTitle + t(' | Jarves Administration');
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

    loadMenu: function(cb) {
        if (this.lastLoadMenuReq) {
            this.lastLoadMenuReq.cancel();
        }

        this.lastLoadMenuReq =
            new Request.JSON({url: _pathAdmin + 'admin/backend/menus', noCache: true, onComplete: function(res) {
                this.menuItems = res.data;
                this.renderMenu();
                if (cb) {
                    cb(res.data);
                }
            }.bind(this)}).get();
    },

    renderMenu: function() {
        if (!this.mainMenuContainer) return;

        this.mainMenuContainer.empty();

        this.btnOpenDashboard = new Element('a', {
            text: 'Dashboard',
            'class': 'jarves-mainMenu-link icon-stats-up'
        }).addEvent('click', this.openDashboard.bind(this)).inject(this.mainMenuContainer);

        this.mainMenu = new jarves.MainMenu(this.mainMenuContainer, this.getMenuItems());
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

//    buildClipboardMenu: function() {
//        this.clipboardMenu = new Element('div', {
//            'class': 'jarves-clipboard-menu'
//        }).inject(this.mainMenu, 'before');
//    },

//    buildUploadMenu: function() {
//        this.uploadMenu = new Element('div', {
//            'class': 'jarves-upload-menu',
//            styles: {
//                height: 22
//            }
//        }).addEvent('mouseover',
//            function() {
//                this.tween('height', this.scrollHeight);
//            }).addEvent('mouseout',
//            function() {
//                this.tween('height', 22);
//            }).inject(this.mainMenu, 'before');
//
//        this.uploadMenuInfo = new Element('div', {
//            'class': 'jarves-upload-menu-info'
//        }).inject(this.uploadMenu);
//    },

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