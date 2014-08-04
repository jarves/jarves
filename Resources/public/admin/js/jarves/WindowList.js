jarves.WindowList = new Class({
    Implements: [Events, Options],

    Binds: ['nestedItemSelected'],

    options: {

        nestedRootAddLabel: null,
        newLabel: null

    },

    loadAlreadyTriggeredBySearch: false,

    initialize: function (pWindow, pContainer, pOptions) {
        this.options = this.setOptions(pOptions);
        this.win = pWindow;

        if (pContainer) {
            this.container = pContainer;
        } else {
            this.container = this.win.content;
        }

        this.container.empty();

//        this.container.setStyle('overflow', 'hidden');
        this.page = 1;
        this.checkboxes = [];

        this.sortField = '';
        this.sortDirection = 'asc';

        //this.oriWinCode = this.win.code;
        this.oriWinEntryPoint = this.options.entryPoint;

        this.load();
        var _this = this;
        this.win.addEvent('objectChanged', this.objectChanged.bind(this));
    },

    objectChanged: function (object) {
        if (object == jarves.normalizeObjectKey(this.classProperties['object'])) {
            this.reload();
        }
    },

    getEntryPoint: function() {
        return this.options.entryPoint || this.win.getEntryPoint();
    },

    reload: function () {
        if (this.classProperties.asNested) {
            return this.renderLayoutNested(this.treeContainer);
        } else {
            this.loadPage(this.currentPage);
        }
    },

    load: function () {
        var _this = this;

        this.container.set('html',
            '<div style="text-align: center; padding: 50px; color: silver">' + t('Loading definition ...') + '</div>');

        new Request.JSON({url: _pathAdmin + this.getEntryPoint()+'/', noCache: true, onComplete: function (res) {
            if (res.error) {
                this.container.set('html', '<div style="text-align: center; padding: 50px; color: red">' +
                    tf('Failed. Error %s: %s', res.error, res.message) + '</div>');
                return false;
            }

            this.render(res.data);
            this.classLoaded = true;
            this.fireEvent('render');

        }.bind(this)}).post({_method: 'options'});
    },

    _deleteSuccess: function () {
    },

    columnHeaderClick: function (pName, pSort) {
        var idx = this.columnsIds.indexOf(pName) + 1;
        var th = this.table.getColumn(idx);

        if (th) {
            if (!this.sortDirection) {
                this.sortDirection = 'ASC';
            }

            if (pSort) {
                this.sortDirection = pSort;
            } else {
                if (this.sortField != pName) {
                    this.sortField = pName;
                    this.sortDirection = (this.sortDirection.toLowerCase() == 'asc') ? 'asc' : 'desc';
                } else {
                    this.sortDirection = (this.sortDirection.toLowerCase() == 'asc') ? 'desc' : 'asc';
                }
            }

            if (this.lastSortedTh) {
                this.lastSortedTh.removeClass('icon-arrow-up-3');
                this.lastSortedTh.removeClass('icon-arrow-down-3');
            }

            this.lastSortedTh = th;
            this.lastSortedTh.addClass(this.sortDirection === 'asc' ? 'icon-arrow-up-3' : 'icon-arrow-down-3');
        }

        this.loadPage(this.currentPage);
        if (!pSort) {
            this.setWinParams();
        }
    },

    setWinParams: function() {
        var order = {};
        order[this.sortField] = this.sortDirection;
        var params = {};
        params.order = order;
        this.win.setParameters(params);
        return params;
    },

    /**
     *
     * @returns {{field: string, direction: string}}
     */
    getSortField: function () {

        var field = null, direction = 'asc';

        if ((typeOf(this.classProperties.order) == 'array' && this.classProperties.order.length > 0) ||
            (typeOf(this.classProperties.order) == 'object' && Object.getLength(this.classProperties.order) > 0)) {

            if (typeOf(this.classProperties.order) == 'array') {
                Array.each(this.classProperties.order, function (order, f) {
                    if (!field) {
                        field = order.field;
                        direction = order.direction;
                    }
                });
            } else if (typeOf(this.classProperties.order) == 'object') {
                Object.each(this.classProperties.order, function (order, f) {
                    if (!field) {
                        field = f;
                        direction = order;
                    }
                });
            }
        } else {
            //just use first column
            if (this.classProperties.columns) {
                Object.each(this.classProperties.columns, function (col, id) {
                    if (field) {
                        return;
                    }
                    field = id;
                })
            }
        }

        return {
            field: field,
            direction: direction
        }
    },

    checkClassProperties: function () {

        if (!this.classProperties.columns || !Object.getLength(this.classProperties.columns)) {
            this.win.alert(t('This window class does not have columns defined.'));
            return false;
        }

        return true;
    },

    render: function (pValues) {
        this.classProperties = pValues;
        this.classProperties.object = jarves.normalizeObjectKey(this.classProperties.object);

        if (!this.checkClassProperties()) {
            return false;
        }

        this.container.empty();

        this.renderTopActionBar();
        this.renderSideActionBar();
        this.renderMultilanguage();
        this.renderDomainDepended();

        this.renderLayout();
        this.renderActionBar();

        this.renderLoader();

        this.renderFinished();
    },

    renderFinished: function () {
        if (this.finishedFired) {
            return;
        }

        if (this.options.noInitLoad == true) {
            return;
        }

        if (this.classProperties.domainDepended && !this.domainSelect.getValue()) {
            return;
        }

        this.finishedFired = true;

        if (this.win.params && this.win.params.list && this.win.params.list.order) {
            Object.each(this.win.params.list.order, function(order, field) {
                this.sortField = field;
                this.sortDirection = order;
            }.bind(this));
        }

        if (!this.loadAlreadyTriggeredBySearch) {
            if (this.columns) {
                if (!this.sortField) {
                    var sort = this.getSortField();
                    this.sortField = sort.field;
                    this.sortDirection = sort.direction;
                }
                this.columnHeaderClick(this.sortField, this.sortDirection);
            } else {
                this.loadPage(1);
            }
        }

        this.fireEvent('renderFinished');
    },

    renderLoader: function () {
        this.win.setLoading(true, t('Loading ...'));
    },

    renderMultilanguage: function () {

        if (this.classProperties.multiLanguage && !this.languageSelect) {
            this.languageSelect = new jarves.Select(this.topActionBar);
//            document.id(this.languageSelect).setStyle('width', 150);

            this.languageSelect.addEvent('change', function() {
                this.changeLanguage();
                this.reloadFirst();
            }.bind(this));

            var hasSessionLang = false;
            Object.each(jarves.settings.langs, function (lang, id) {
                this.languageSelect.add(id, lang.langtitle + ' (' + lang.title + ', ' + id + ')');
                if (id == window._session.lang) {
                    hasSessionLang = true;
                }
            }.bind(this));

            if (hasSessionLang) {
                this.languageSelect.setValue(window._session.lang);
            }
        }
    },

    renderDomainDepended: function() {
        if (this.classProperties.domainDepended) {

            this.domainSelect = new jarves.Select(this.topActionBar, {
                object: 'jarves/domain',
                onReady: function() {
                    this.renderFinished();
                }.bind(this)
            });
//            document.id(this.domainSelect).setStyle('width', 150);

            this.domainSelect.addEvent('change', this.reloadFirst.bind(this));
        }
    },

    changeLanguage: function() {

    },

    reloadFirst: function() {
        this.loadPage(1);
    },

    getLanguage: function() {
        if (this.languageSelect) {
           return this.languageSelect.getValue();
        }
    },

    renderLayout: function () {
        this.win.getTitleGroupContainer().setStyle('margin-bottom', 10);

        if (this.classProperties.asNested) {
            this.renderLayoutNested(this.container);
        } else {
            this.renderLayoutTable();
        }
    },

    renderLayoutNested: function (pContainer) {
        var objectOptions = {};

        pContainer.empty();

        objectOptions.type = 'tree';
        objectOptions.object = this.classProperties.object;
        objectOptions.entryPoint = this.getEntryPoint();
        objectOptions.scopeChooser = false;
        objectOptions.noWrapper = true;
        objectOptions.selectObject = this.selected;

        if (this.languageSelect) {
            objectOptions.scopeLanguage = this.languageSelect.getValue();
        }

        if (this.domainSelect) {
            objectOptions.scopeDomain = this.domainSelect.getValue();
        }

        this.nestedField = new jarves.Field(objectOptions);

        this.nestedField.inject(pContainer, 'top');

        if (this.classProperties.edit) {
            this.nestedField.addEvent('select', this.nestedItemSelected.bind(this));
        }
    },

    nestedItemSelected: function () {

    },

    addNestedRoot: function () {
        //open
        jarves.entrypoint.open(jarves.entrypoint.getRelative(this.getEntryPoint(),
            this.classProperties.nestedRootAddEntrypoint), {
            lang: (this.languageSelect) ? this.languageSelect.getValue() : false
        }, this);
    },

    openAddItem: function () {
        jarves.wm.open(jarves.entrypoint.getRelative(this.getEntryPoint(), this.classProperties.addEntrypoint), {
            lang: (this.languageSelect) ? this.languageSelect.getValue() : false
        }, this.win.getId(), true);
    },

    renderLayoutTable: function () {
        this.mainContainer = new Element('div', {
            'class': 'jarves-Table-windowList-container'
        }).inject(this.container);

        this.table = new jarves.Table(null, {
            selectable: true,
            safe: false
        });

        this.win.addEvent('resize', this.table.updateTableHeader);
        document.id(this.table).addClass('jarves-Table-windowList');
        this.table.inject(this.mainContainer);

        //[ ["label", optionalWidth], ["label", optionalWidth], ... ]
        var columns = [];

        var indexOffset = 0;
        if (this.classProperties.remove == true) {
            indexOffset = 1;
            this.columnCheckbox = new Element('input', {
                value: 1,
                type: 'checkbox'
            }).addEvent('click', function () {
                    var checked = this.columnCheckbox.checked;
                    this.checkboxes.each(function (checkbox) {
                        checkbox.checked = checked;
                    });
                }.bind(this));
            columns.push([this.columnCheckbox, 21]);
        }

        this.columns = {};
        if (!this.classProperties.columns || this.classProperties.columns.length == 0) {
            this.win.alert(t('This class does not contain any columns.'), function () {
                this.win.close();
            }.bind(this));
            throw 'Class does not contain columns.';
        }

        this.columnsIds = 1 === indexOffset ? [false] : [];

        Object.each(this.classProperties.columns, function (column, columnId) {
            columns.push([t(column.label || columnId), column.width, column.align]);
            this.columnsIds.push(columnId);
        }.bind(this));

        /*** edit-Th ***/
        if (this.classProperties.remove == true || this.classProperties.edit == true ||
            this.classProperties.itemActions) {
            this.titleIconTdIndex = columns.length;
            columns.push(['', 40]);
        }

        var columnThs = this.table.setColumns(columns);

        this.table.addEvent('selectHead', function (item) {
            var idx = columnThs.indexOf(item);
            if (false !== this.columnsIds[idx]) {
                this.columnHeaderClick(this.columnsIds[idx]);
            }
        }.bind(this));
        this.titleIconTd = this.table.getColumn(this.titleIconTdIndex);
    },

    renderActionBar: function () {
        var _this = this;

        this.actionBarNavigation = new Element('div', {
            'class': 'jarves-WindowList-actionBarNavigation'
        }).inject(this.mainContainer);

        this.navigateActionBar = new jarves.ButtonGroup(this.actionBarNavigation, {
            onlyIcons: true
        });

        document.id(this.navigateActionBar).addClass('jarves-WindowList-navigationBar');

        this.ctrlPrevious =
            this.navigateActionBar.addIconButton(t('Go to previous page'), '#icon-arrow-left-15', function () {
                this.loadPage(parseInt(_this.ctrlPage.value) - 1);
            }.bind(this));

        this.ctrlPage = new Element('input', {
            'class': 'jarves-Input-text jarves-WindowList-actionBar-page'
        }).addEvent('keydown',function (e) {
                if (e.key == 'enter') {
                    _this.loadPage(parseInt(_this.ctrlPage.value));
                }
                if (['backspace', 'left', 'right'].indexOf(e.key) == -1 && (!parseInt(e.key) + 0 > 0)) {
                    e.stop();
                }
            }).inject(this.navigateActionBar);

        this.ctrlMax = new Element('div', {
            'class': 'jarves-WindowList-actionBar-page-count',
            text: '/ 0'
        }).inject(this.navigateActionBar);

        this.ctrlNext = this.navigateActionBar.addIconButton(t('Go to next page'), '#icon-arrow-right-15', function () {
            this.loadPage(parseInt(_this.ctrlPage.value) + 1);
        }.bind(this));
    },

    getSidebar: function() {
        return this.options.sidebar || this.win.getSidebar();
    },

    renderSideActionBar: function() {
        var container = this.getSidebar();

        this.sideBarTitle = new Element('div', {
            'class': 'jarves-Window-sidebar-title',
            text: t('Actions')
        }).inject(container);

        if (this.classProperties.add) {
            this.addBtn = new jarves.Button([this.options.newLabel || this.classProperties.newLabel, jarves.mediaPath(this.classProperties.addIcon)])
                .addEvent('click', function() {
                    this.openAddItem();
                }.bind(this))
                .inject(container);
        }

        if (this.classProperties.asNested && (this.classProperties.nestedRootAdd)) {
            this.addRootBtn = new jarves.Button([this.options.nestedRootAddLabel ||
                this.classProperties.nestedRootAddLabel, jarves.mediaPath(this.classProperties.nestedRootAddIcon)])
                .addEvent('click', function() {
                    this.addNestedRoot();
                }.bind(this))
                .inject(container);
        }

        if (this.classProperties.remove) {
            this.removeBtn = new jarves.Button([t('Remove selection'), jarves.mediaPath(this.classProperties.removeIcon)])
                .addEvent('click', function() {
                    this.removeSelected();
                }.bind(this))
                .inject(container);
        }
    },

    renderTopActionBar: function (container) {
        this.topActionBar = container || this.win.getTitleGroupContainer();

        this.actionBarSearchContainer = new Element('div', {
            'class': 'jarves-WindowList-searchContainer'
        }).inject(this.topActionBar);

//        this.topActionBar.setStyle('min-height', 30);

        this.actionBarSearchInput = new jarves.Field({
            noWrapper: true,
            type: 'text',
            inputIcon: '#icon-search-8',
            inputWidth: 150
        }, this.actionBarSearchContainer);

        this.actionBarSearchInput.addEvent('change', function(){
            this.onSearchInputChange();
        }.bind(this));

        /*
         TODO

         if (this.classProperties['export'] || this.classProperties['import']) {
         this.exportNavi = this.win.addButtonGroup();
         }

         if (this.exportNavi) {
         if (this.classProperties['export']) {
         this.exportType = new Element('select', {
         style: 'position: relative; top: -2px;'
         })
         bject.each(this.classProperties['export'], function (fields, type) {
         new Element('option', {
         value: type,
         html: t(type)
         }).inject(this.exportType);
         }.bind(this));
         _
         this.exportNavi.addButton(this.exportType, '');
         this.exportNavi.addButton(_('Export'), _path + 'bundles/jarves/admin/images/icons/table_go.png', this.exportTable.bind(this));
         }

         if (this.classProperties['import']) {
         this.exportNavi.addButton(_('Import'), _path + 'bundles/jarves/admin/images/icons/table_row_insert.png');
         }


         }*/
    },

    onSearchInputChange: function() {
        this.loadPage(1);
    },

    removeSelected: function (pItems) {
        if (!pItems) {
            pItems = this.getSelected();
        }
        if ('array' === typeOf(pItems) && 0 < pItems.length) {
            this.win.confirm(_('Really remove selected?'), function (res) {
                if (!res) {
                    return;
                }

                if (this.lastDeleteRq) {
                    this.lastDeleteRq.cancel();
                }

                this.lastDeleteRq = new Request.JSON({url: _pathAdmin + this.getEntryPoint() + '/',
                    noCache: 1, onComplete: function (res) {

                    this.win.setLoading(false);
                    jarves.getAdminInterface().objectChanged(this.classProperties['object']);
                    this._deleteSuccess();

                }.bind(this)}).post({
                    _method: 'delete',
                    pks: pItems
                });
            }.bind(this));
        }
    },

    deleteItem: function (pItem) {
        var objectId = jarves.getObjectUrlId(this.classProperties['object'], pItem);

        return this.removeSelected([objectId]);
    },

    getSelected: function () {
        var res = [];
        this.checkboxes.each(function (check) {
            if (check.checked) {
                res.include(check.value);
            }
        });
        return res.length > 0 ? res : false;
    },

    exportTable: function () {
        //TODO, order ..
        var params = new Hash({
            exportType: this.exportType.value,
            orderBy: this.sortField,
            filter: this.searchEnabled,
            filterVals: (this.searchEnabled) ? this.getSearchVals() : '',
            lang: (this.languageSelect) ? this.languageSelect.getValue() : false,
            orderByDirection: this.sortDirection,
            params: JSON.encode(this.win.params)
        });
        if (this.lastExportForm) {
            this.lastExportForm.destroy();
            this.lastExportFrame.destroy();
        }
        this.lastExportForm = new Element('form', {
            action: _pathAdmin + this.getEntryPoint() + '?cmd=exportItems&' + params.toQueryString(),
            method: 'post',
            target: 'myExportFrame' + this.win.id
        }).inject(document.hiddenElement);
        this.lastExportFrame = new IFrame(null, {
            name: 'myExportFrame' + this.win.id
        }).inject(document.hiddenElement);
        this.lastExportForm.submit();
    },

    addDummy: function () {
        var tr = new Element('tr').inject(this.tbody);
        var count = this.dummyCount + Object.getLength(this.classProperties.columns);
        new Element('td', {
            colspan: count,
            styles: {
                height: 'auto'
            }
        }).inject(tr);
    },

    loadItemCount: function (callback) {
        var req = {};

        if (this.searchEnabled) {
            var vals = this.getSearchVals();
            Object.each(vals, function (val, id) {
                req['_' + id] = val;
            });
        }

        this.lastRequest = new Request.JSON({url: _pathAdmin + this.getEntryPoint() + '/:count',
            noCache: true,
            onComplete: function (res) {
                if (!res || res.error) {
                    this.win.alert(tf('There was an error: %s: %s', res.error, res.message));
                } else {
                    this.itemsCount = res.data;
                    this.maxPages = Math.ceil(res.data / this.classProperties.itemsPerPage);

                    this.ctrlMax.set('text', '/ ' + this.maxPages);
                    if (callback) {
                        callback();
                    }
                }
            }.bind(this)}).get(req);

    },

    loadPage: function (pPage) {
        pPage = pPage || 1;
        if ('null' === typeOf(this.itemsCount)) {
            this.loadItemCount(function () {
                this.loadPage(pPage);
            }.bind(this));
            return;
        }

        if (this.lastResult && pPage != 1) {
            if (pPage > this.maxPages) {
                return;
            }
        }

        if (pPage <= 0) {
            return;
        }

        if (this.lastLoadPageRequest) {
            this.lastLoadPageRequest.cancel();
        }

        this.win.setLoading(true, t('Loading ...'));

        var req = {};
        this.ctrlPage.value = pPage;

        req.offset = (this.classProperties.itemsPerPage * pPage) - this.classProperties.itemsPerPage;
        req.lang = (this.languageSelect) ? this.languageSelect.getValue() : null;

        req.withAcl = true;
        req.order = {};
        req.order[this.sortField] = this.sortDirection;
        if (this.actionBarSearchInput) {
            req.q = this.actionBarSearchInput.getValue();
        }

        this.lastLoadPageRequest = new Request.JSON({url: _pathAdmin + this.getEntryPoint() + '/',
            noCache: true,
            onComplete: function (res) {
                this.currentPage = pPage;

                this.renderItems(res.data || []);
            }.bind(this)}).get(req);
    },

    renderItems: function (pResult) {
        this.checkboxes = [];

        this.win.setLoading(false);

        this.lastResult = pResult;

        [this.ctrlPrevious, this.ctrlNext].each(function (item) {
            document.id(item).setStyle('opacity', 1);
        });
        if (this.lastNoItemsDiv) {
            this.lastNoItemsDiv.destroy();
        }

        if (1 === this.currentPage && 0 === pResult.length) {
            this.ctrlPage.value = 0;
        }

        if (this.currentPage <= 1) {
            //this.ctrlFirst.setStyle('opacity', 0.2);
            document.id(this.ctrlPrevious).setStyle('opacity', 0.2);
        }

        if (this.currentPage >= this.maxPages) {
            document.id(this.ctrlNext).setStyle('opacity', 0.2);
            //this.ctrlLast.setStyle('opacity', 0.2);
        }

        this.table.empty();

        if (pResult) {
            Array.each(pResult, function (item) {
                this.addItem(item);
            }.bind(this));
        }
    },

    select: function (pItem) {
        var tr = pItem.getParent();

        if (this._lastSelect == tr) {
            return;
        }

        if (this._lastSelect) {
            this._lastSelect.removeClass('active');
        }

        tr.addClass('active');
        this._lastSelect = tr;
    },

    openEditItem: function (pItem) {
        jarves.entrypoint.open(jarves.entrypoint.getRelative(this.getEntryPoint(), this.classProperties.editEntrypoint), {
            item: pItem
        }, this.win.getId(), true, this.win.getId());
    },

    addItem: function (pItem) {
        var _this = this;

        var row = [];

        var pk = jarves.getObjectUrlId(this.classProperties['object'], pItem);

        if (this.classProperties.remove == true) {
            var checkbox = new Element('input', {
                value: pk,
                type: 'checkbox'
            });
            this.checkboxes.include(checkbox);

            if (!pItem['_deletable']) {
                checkbox.disabled = true;
            }
            row.push(checkbox);
        }

        Object.each(this.classProperties.columns, function (column, columnId) {
            var value = jarves.getObjectFieldLabel(pItem, column, columnId, this.classProperties['object']);
            row.push(value);
        }.bind(this));

        if (this.classProperties.remove == true || this.classProperties.edit == true ||
            this.classProperties.itemActions) {
            var icon = new Element('div', {
                'class': 'edit'
            });

            row.push(icon);

            if (this.classProperties.itemActions && this.classProperties.itemActions.each) {
                this.classProperties.itemActions.each(function (action) {

                    var action = null;
                    if (typeOf(action) == 'array') {

                        if (action[1].substr(0, 1) == '#') {

                            action = new Element('div', {
                                style: 'cursor: pointer; display: inline-block; padding: 0px 1px;',
                                'class': action[1].substr(1),
                                title: action[0]
                            }).inject(icon);

                        } else {
                            action = new Element('img', {
                                src: jarves.mediaPath(action[1]),
                                title: action[0]
                            }).inject(icon);
                        }

                        //compatibility
                        action.addEvent('click',function () {
                            jarves.wm.open(action[2], {item: pItem, filter: action[3]});
                        }).inject(icon);
                    }

                    if (typeOf(action) == 'object') {

                        if (action.icon.substr(0, 1) == '#') {

                            action = new Element('div', {
                                style: 'cursor: pointer; display: inline-block; padding: 0px 1px;',
                                'class': action.icon.substr(1),
                                title: action.label
                            }).inject(icon);

                        } else {
                            action = new Element('img', {
                                src: jarves.mediaPath(action.icon),
                                title: action.label
                            }).inject(icon);
                        }

                        //compatibility
                        action.addEvent('click',function () {
                            jarves.entrypoint.open(action.entrypoint, {item: pItem}, this);
                        }).inject(icon);
                    }
                });
            }

            if (pItem._editable) {
                var editIcon = null;

                if (_this.classProperties.editIcon.substr(0, 1) == '#') {

                    editIcon = new Element('div', {
                        style: 'cursor: pointer; display: inline-block; padding: 0px 1px;',
                        'class': _this.classProperties.editIcon.substr(1)
                    }).inject(icon);

                } else {
                    editIcon = new Element('img', {
                        src: jarves.mediaPath(_this.classProperties.editIcon)
                    }).inject(icon);
                }

                editIcon.addEvent('click',function () {
                    this.openEditItem(pItem);
                }.bind(this)).inject(icon);
            }
            if (pItem._deletable) {

                var removeIcon = _this.classProperties.removeIconItem ? _this.classProperties.removeIconItem :
                    _this.classProperties.removeIcon;

                if (typeOf(removeIcon) == 'string') {
                    var deleteBtn = null;

                    if (removeIcon.substr(0, 1) == '#') {

                        deleteBtn = new Element('div', {
                            style: 'cursor: pointer; display: inline-block; padding: 0px 1px;',
                            'class': removeIcon.substr(1)
                        }).inject(icon);

                    } else {
                        deleteBtn = new Element('img', {
                            src: jarves.mediaPath(removeIcon)
                        }).inject(icon);
                    }

                    deleteBtn.addEvent('click', function () {
                        this.deleteItem(pItem);
                    }.bind(this));
                }
            }
        }

        var tr = this.table.addRow(row);

        tr.addEvent('click:relay(td)', function (e, item) {
                this.select(item);
            }.bind(this))
            .addEvent('dblclick', function (e) {
                if (this.classProperties.edit) {
                    this.openEditItem(pItem);
                }
            }.bind(this));
    }
})
