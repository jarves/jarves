var jarves_system_settings = new Class({

    Binds: ['renderData', 'save'],

    systemValues: {},

    initialize: function (pWin) {
        this.win = pWin;

        this.preload();
    },

    preload: function () {
        this.win.setLoading(true);

        new Request.JSON({url: _pathAdmin + 'admin/system/config/labels', noCache: 1, onComplete: function (pResponse) {
            var res = pResponse.data;

            this.langs = res.langs;
            this.timezones = [];
            res.timezones.each(function (timezone) {
                this.timezones.include({l: timezone});
            }.bind(this));

            this._createLayout();

        }.bind(this)}).get();
    },

    renderData: function (data) {
        this.fieldObject.setValue(data);

        this.win.setLoading(false);
    },

    _createLayout: function () {
        var fields = {
            '__general__': {
                type: 'tab',
                label: t('General'),
                children: {
                    systemTitle: {
                        type: 'text',
                        label: 'System title',
                        required: true,
                        desc: t('Appears in the administration title.')
                    },
                    adminUrl: {
                        type: 'text',
                        label: 'Administration url prefix',
                        desc: t('Default is `jarves`. Without trailing or starting slash.')
                    },
                    debug: {
                        type: 'checkbox',
                        label: 'Administration Debug Mode'
                    },
                    email: {
                        type: 'text',
                        label: 'System Email'
                    },
                    checkUpdates: {
                        type: 'checkbox',
                        'default': false,
                        label: t('Check for updates')
                    },
                    languages: {
                        type: 'textboxList',
                        label: t('Languages'),
                        desc: t('Limit the language selection, system-wide.'),
                        itemsKey: 'code',
                        labelTemplate: '{title} ({langtitle}, {code})',
                        items: this.langs
                    }
                }
            },
            '__system__': {
                type: 'tab',
                label: t('System'),
                children: {
                    'cache[class]': {
                        label: t('Caching driver'),
                        type: 'select',
                        desc: t('You should probably use a caching driver for external caching if you have load-balanced szenario, since this cache has to be known in every installation.'),
                        items: {
                        },
                        children: {
                        }
                    },
                    '__errorLog__': {
                        type: 'childrenSwitcher',
                        label: t('Error log'),
                        children: {

                            'displayErrors': {
                                label: t('Display errors'),
                                desc: t('Prints errors to the frontend clients. You should deactivate this in productive systems.'),
                                type: 'checkbox'
                            },
                            'displayDetailedRestErrors': {
                                label: t('Display REST error'),
                                type: 'checkbox',
                                desc: t('Display more information in REST errors, like line number, file path and backstrace.')
                            },
                            'logErrors': {
                                label: t('Save errors into a log file'),
                                type: 'checkbox',
                                children: {
                                    'logErrorsFile': {
                                        needValue: 1,
                                        label: t('Log file'),
                                        desc: t('Example: jarves.log')
                                    }
                                }
                            },
                            'dbErrorPrintSql': {
                                label: t('Display the full SQL in the error log'),
                                'default': false,
                                type: 'checkbox'
                            },
                            'dbExceptionsNoStop': {
                                label: t('Do not stop the script during an query failure'),
                                'default': false,
                                type: 'checkbox'
                            },
                            'debugLogSqls': {
                                label: t('[Debug] Log all SQL queries'),
                                'default': false,
                                desc: t('Deactivate this on productive machines, otherwise it will blow up your logs!'),
                                type: 'checkbox'
                            }
                        }
                    },
                    'timezone': {
                        label: t('Server timezone'),
                        type: 'select',
                        items: this.timezones,
                        itemsKey: 'code'
                    },
                    fileGroupName: {
                        label: t('File group owner'),
                        type: 'text'
                    },
                    fileGroupPermission: {
                        label: t('File group permission'),
                        type: 'select',
                        items: {rw: t('Read/Write'), r: t('Read'), '-': t('Nothing')}
                    },
                    fileEveryonePermission: {
                        label: t('File everyone permission'),
                        type: 'select',
                        items: {rw: t('Read/Write'), r: t('Read'), '-': t('Nothing')}
                    },
                    fileNoChangeMode: {
                        label: t('Do not change file mode by existing files'),
                        desc: t('In some circumstances it is necessary to disable the chmod call on existing files. For example if your IDE or a custom interface always changes the owner of Jarves cms files.'),
                        type: 'checkbox',
                        'default': false
                    }
                }
            },
            '__media__': {
                type: 'tab',
                label: t('Media'),
                children: {
                    localFileUrl: {
                        type: 'text',
                        label: t('Local file URL'),
                        desc: t('For http proxy (vanish, AWS cloudfront etc) you should enter the URL here. Default is empty.')
                    },
                    mounts: {
                        label: t('External file mount'),
                        desc: t('Here you can connect with a external cloud storage server'),
                        type: 'array',
                        asHash: true,
                        columns: [
                            {label: t('Mount name'), width: 100},
                            t('Driver')
                        ],
                        fields: {
                            name: {
                                type: 'text'
                            },
                            driver: {
                                type: 'select'
                            }
                        }

                    }
                }
            },
            '__client__': {
                type: 'tab',
                label: t('Client'),
                children: {
                    'client[class]': {
                        type: 'select',
                        label: t('Backend client driver'),
                        desc: t('Login, session processing etc. The user "admin" always authenticate against the Jarves cms users database.'),
                        items: {
                            '\\Jarves\\Client\\JarvesUsers': t('Jarves cms users database')
                        },
                        children: {
                            'client[config][\\Jarves\\Client\\JarvesUsers][email_login]': {
                                'label': t('Allow email login'),
                                'type': 'checkbox',
                                'needValue': '\\Jarves\\Client\\JarvesUsers'
                            },
                            'client[config][\\Jarves\\Client\\JarvesUsers][timeout]': {
                                label: t('Session timeout'),
                                type: 'text',
                                'default': '3600',
                                'needValue': '\\Jarves\\Client\\JarvesUsers'
                            },
                            'client[config][\\Jarves\\Client\\JarvesUsers][passwordHashCompat]': {
                                'type': 'checkbox',
                                'label': t('Activate the compatibility in the authentication with older Jarves cms'),
                                'default': 1,
                                'needValue': '\\Jarves\\Client\\JarvesUsers',
                                'desc': t('If you did upgrade from a older version than 1.0 than you should probably let this checkbox active.')
                            }
                        }
                    },
                    'client[store][class]': {
                        type: 'select',
                        label: t('Session storage'),
                        items: {
                            '\\Jarves\\Cache\\PHPSessions': t('PHP-Sessions')
                        },
                        children: {
                        }
                    },
                    'client[store][autoStart]': {
                        type: 'checkbox',
                        'default': true,
                        label: t('Session auto boot'),
                        desc: t('You can deactivate the automatic distribution of session ids via cookie if you disable this option. To track the user, you have to start then the process in your module manually.')

                    },
                    '__info__': {
                        'type': 'label',
                        'label': t('Frontend client handling'),
                        'desc': t('You can overrite these settings per domain under <br />Pages -> Domain -> Client.')
                    }
                }
            }

        };

        Object.each(jarves.settings.configs, function (config) {

            //map FAL driver
            if (config.falDriver) {
                if (!fields.__media__.children.mounts.fields.driver.items) {
                    fields.__media__.children.mounts.fields.driver.items = {};
                }

                if (!fields.__media__.children.mounts.fields.driver.children) {
                    fields.__media__.children.mounts.fields.driver.children = {};
                }

                Object.each(config.falDriver, function (driver, key) {
                    fields.__media__.children.mounts.fields.driver.items[driver.class] = driver.title;

                    if (driver.properties) {
                        Object.each(driver.properties, function (property) {
                            property.needValue = driver.class;
                        });
                        jarves.addFieldKeyPrefix(driver.properties, 'driverOptions[' + driver.class + ']')
                        Object.append(fields.__media__.children.mounts.fields.driver.children, driver.properties);
                    }
                });
            }

            //map Auth driver
            if (config.clientDriver) {

                Object.each(config.clientDriver, function (driver, key) {
                    fields.__client__.children['client[class]'].items[driver.class] = driver.title;

                    if (driver.properties) {
                        Object.each(driver.properties, function (property) {
                            property.needValue = driver.class;
                        });
                        var properties = Object.clone(driver.properties);
                        jarves.addFieldKeyPrefix(properties, 'client[config][' + driver.class + ']')
                        Object.append(fields.__client__.children['client[class]'].children, properties);
                    }
                });
            }

            //map cache driver
            if (config.cacheDriver) {

                Object.each(config.cacheDriver, function (driver, key) {
                    fields.__system__.children['cache[class]'].items[driver.class] = driver.title;

                    if (driver.properties) {
                        Object.each(driver.properties, function (property) {
                            property.needValue = driver.class;
                        });
                        var properties = Object.clone(driver.properties);
                        jarves.addFieldKeyPrefix(properties, 'cache[config][' + driver.class + ']')
                        Object.append(fields.__system__.children['cache[class]'].children, properties);
                    }

                    fields.__client__.children['client[store][class]'].items[driver.class] = driver.title;

                    if (driver.properties) {
                        Object.each(driver.properties, function (property) {
                            property.needValue = driver.class;
                        });
                        var properties = Object.clone(driver.properties);
                        jarves.addFieldKeyPrefix(properties, 'client[store][config][' + driver.class + ']')
                        Object.append(fields.__client__.children['client[store][class]'].children, properties);
                    }
                });
            }

        });

        this.actionBarContainer = new Element('div', {
            style: 'text-align: right; '
        }).inject(this.win.getTitleGroupContainer());

        this.actionBar = new jarves.ButtonGroup(this.actionBarContainer);
        document.id(this.actionBar).setStyle('float', 'right');
        this.resetBtn = this.actionBar.addButton(t('Reset'), '#icon-escape');
        this.saveBtn = this.actionBar.addButton(t('Save'), '#icon-checkmark-6');
        this.saveBtn.setButtonStyle('blue');

        this.fieldObject = new jarves.FieldForm(this.win.content, fields, {
            allTableItems: true,
            tabsInWindowHeader: true,
            saveButton: this.saveBtn
        }, {
            win: this.win
        });

        this.load();

    },

    save: function () {

        var data = this.fieldObject.getValue();

        //map config

        data.client.config = data.client.config ? data.client.config[data.client.class] : {};
        data.cache.config = data.cache.config ? data.cache.config[data.cache.class] : {};

        this.saveBtn.startTip(t('Saving ...'));

        if (this.lastSave) {
            this.lastSave.cancel();
        }

        this.lastSave = new Request.JSON({url: _path + 'admin/system/config', onComplete: function (pResponse) {

            if (pResponse.error) {
                this.win.alert(pResponse.error + ': ' + pResponse.message);
                this.saveBtn.stopTip(t('Failed'));
            } else {
                this.saveBtn.stopTip(t('Done'));
            }

        }.bind(this)}).post(data);
    },

    changeType: function (pType) {
        Object.each(this.tabButtons, function (button, id) {
            button.setPressed(false);
            this.panes[id].setStyle('display', 'none');
        }.bind(this));
        this.panes[ pType ].setStyle('display', 'block');
        this.tabButtons[ pType ].setPressed(true);
    },

    load: function () {
        if (this.lr) {
            this.lr.cancel();
        }

        this.lr = new Request.JSON({url: _pathAdmin + 'admin/system/config', noCache: 1, onComplete: function(response) {
            this.renderData(response.data);
        }.bind(this)}).get();

    },

    save23: function () {
        var req = {};
        var dontGo = false;

        Object.each(this.fields, function (field, key) {
            if (!field) {
                return;
            }
            if (dontGo) {
                return;
            }
            if (!field.isOk()) {
                dontGo = true;
                var parent = field.main.getParent();
                if (!parent.get('lang')) {
                    parent = field.main.getParent().getParent();
                }

                this.changeType(parent.get('lang'));
            }
            req[key] = field.getValue();
        }.bind(this));

        var auth_class = this.fields['auth_class'].getValue();
        var obj = this.auth_params_objects[ auth_class ];

        if (obj) {
            if (!obj.isOk()) {
                return;
            }
            req['auth_params'] = obj.getValue();
        }
        if (dontGo) {
            return;
        }

        if (!this.databaseFieldObj.isOk()) {
            this.changeType('database');
            return;
        }

        req['database'] = {};

        var values = this.databaseFieldObj.getValue();
        Object.each(values, function (val, key) {
            req['database'][key] = val;
        })

        this.saveButton.startTip(_('Saving ...'));

        this.loader.show();

        if (this.ls) {
            this.ls.cancel();
        }

        this.ls = new Request.JSON({url: _pathAdmin +
            'admin/system/settings/saveSettings', noCache: 1, onComplete: function (r) {
            if (r.needPw) {
                this.saveButton.startTip(_('Wating ...'));
                this.win._passwordPrompt(_('Please enter your password'), '', this.saveCommunity.bind(this));
            } else {
                this.saveButton.stopTip(_('Saved'));
                jarves.loadSettings();
                this.loader.hide();
            }
        }.bind(this)}).post(req);
    },

    saveCommunity: function (pPasswd) {
        if (!pPasswd) {
            this.loader.hide();
        }
        if (this.lsc) {
            this.lsc.cancel();
        }
        this.lsc = new Request.JSON({url: _pathAdmin +
            'admin/system/settings/saveCommunity', noCache: 1, onComplete: function (r) {
            this.loader.hide();
            if (r == 2) {
                this.saveButton.stopTip(_('Error'));
                this.win._alert(_('Cannot connect to community server.'));
                return;
            }
            if (r == 0) {
                this.saveButton.stopTip(_('Error'));
                this.win._alert(_('Access denied'));
                this.fields['communityEmail'].setValue(this.oldCommunityEmail);
                return;
            }
            this.saveButton.stopTip(_('Saved'));
            jarves.loadSettings();
        }.bind(this)}).post({email: this.fields['communityEmail'].getValue(), passwd: pPasswd });
    }
});
