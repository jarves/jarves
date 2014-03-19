jarves.WindowCombine = new Class({
    Extends: jarves.WindowList,
    lastSortValue: false,
    itemsLoadedCount: 0,
    combine: true,

    maxItems: null,

    searchPaneHeight: 110,

    currentViewType: '',

    combineCheckboxes: [],

    renderLayout: function() {
        this.win.content.addClass('jarves-WindowList-combine-content');

        this.container = this.listContainer = new Element('div', {
            'class': 'jarves-windowCombine-list-container'
        }).inject(this.win.content);

        this.combineContainer = new Element('div', {
            'class': 'jarves-windowCombine-combine-container'
        }).inject(this.win.content);

        //this.combineContainer.setStyle('opacity', 0);
        this.win.getTitleGroupContainer().setStyle('margin-bottom', 10);

        this.renderLayoutTable();

        this.contentLayout = new jarves.Layout(this.combineContainer, {
            layout: [
                {
                    columns: [300, 15, null]
                }
            ],
            splitter: [
                [1, 1, 'right']
            ]
        });

        this.mainLeft = new Element('div', {
            'class': 'jarves-WindowList-combine-left'
        }).inject(this.contentLayout.getCell(1, 1), 'top');

        this.mainLeft.set('tween', {duration: 100});

        this.mainRight = this.contentLayout.getCell(1, 3);
        this.mainRight.addClass('jarves-WindowList-combine-right');

        this.combineLeftToggler = new Element('a', {
            'class': 'icon-arrow-left-5 jarves-windowCombine-left-toggler'
        }).inject(this.contentLayout.getCell(1, 1));

        this.displayCombineLeft(true);

        this.combineLeftToggler.addEvent('click', function() {
            this.displayCombineLeft(!this.isCombineLeftVisible());
        }.bind(this));

        this.contentLayout.getCell(1, 2).destroy();
        this.contentLayout.getTd(1, 2);

        if (this.classProperties.asNested) {
            this.treeContainer = new Element('div', {
                'class': 'jarves-windowCombine-treeContainer jarves-objectTree-container'
            }).inject(this.mainLeft, 'top');

            this.renderLayoutNested(this.treeContainer);
        } else {
            //classic list
            this.mainLeftItems = new Element('div', {
                'class': 'jarves-WindowList-combine-items jarves-List'
            }).addEvent('scroll', this.checkScrollPosition.bind(this, true)).inject(this.mainLeft, 'top');

            this.mainLeftItems.addEvent('click:relay(.jarves-List-item)', function(event, item) {
                if (event.target.hasClass('jarves-List-item-remove') || event.target.getParent('.jarves-List-item-remove')) {
                    return;
                }
                this.loadItem(item._item);
            }.bind(this));

            this.mainLeftSearch = new Element('div', {
                'class': 'jarves-WindowList-combine-searchpane'
            }).inject(this.mainLeft, 'top');

            this.mainLeftTop = new Element('div', {
                'class': 'jarves-WindowList-combine-left-top'
            }).inject(this.mainLeft, 'top');

            this.sortSpan = new Element('span', {
                'class': 'jarves-WindowList-combine-search'
            }).inject(this.mainLeftTop);

            this.itemCount = new Element('div', {
                'class': 'jarves-WindowList-combine-left-itemcount'
            }).inject(this.mainLeftTop);

            this.itemsFrom = new Element('span', {text: '0'}).inject(this.itemCount);
            new Element('span', {text: '-'}).inject(this.itemCount);
            this.itemsLoaded = new Element('span', {text: '0'}).inject(this.itemCount);
            new Element('span', {text: t('%d of %d').replace('%d', '').replace('%d', '')}).inject(this.itemCount);
            this.itemsMaxSpan = new Element('span', {text: '0'}).inject(this.itemCount);

            this.mainLeftDeleter = new Element('div', {
                'class': 'kwindow-win-buttonBar jarves-windowCombine-list-actions'
            }).inject(this.mainLeft);

            new jarves.Button(t('Select all')).addEvent('click', function() {
                if (!this.combineCheckboxes) {
                    return;
                }
                if (this.checkedAll) {
                    $$(this.combineCheckboxes).set('checked', false);
                    this.checkedAll = false;
                } else {
                    $$(this.combineCheckboxes).set('checked', true);
                    this.checkedAll = true;
                }
            }.bind(this)).inject(this.mainLeftDeleter);

            this.removeCombineSelectedBtn = new jarves.Button(t('Remove selected')).addEvent('click', this.removeCombineSelected.bind(this)).inject(this.mainLeftDeleter);

            this.removeCombineSelectedBtn.setButtonStyle('blue');

            //window.addEvent('resize', this.checkScrollPosition.bind(this));

            this.mainLeftItemsScroll = new Fx.Scroll(this.mainLeftItems, {
                transition: Fx.Transitions.linear,
                duration: 300
            });

            this.win.addEvent('resize', this.checkScrollPosition.bind(this, true));

            document.addEvent('keydown', function(e) {
                this.leftItemsDown.call(this, e)
            }.bind(this));

            this.renderSearchPane();
            this.createItemLoader();
        }
    },

    removeSelected: function() {
        if (!this.isCombineView()) {
            return this.parent();
        }

        var deleterActionsVisible = !!this.mainLeftDeleter.getStyle('height').toInt();
        if (!deleterActionsVisible) {
            //toggle in
            this.mainLeftDeleter.tween('height', 40);
            this.mainLeftItems.addClass('jarves-List-showRemove');
            this.mainLeftItems.tween('bottom', 40);
        } else {
            this.mainLeftItems.removeClass('jarves-List-showRemove');
            this.mainLeftDeleter.tween('height', 0);
            this.mainLeftItems.tween('bottom', 0);
        }
    },

    getCombinedSelected: function() {
        var res = [];
        this.combineCheckboxes.each(function(check) {
            if (check.checked) {
                res.include(check.value);
            }
        });
        return res.length > 0 ? res : false;
    },

    removeCombineSelected: function() {

        jarves.getAdminInterface().objectChanged(this.classProperties['object']);

        return;
        var items = this.getCombinedSelected();
        if ('array' === typeOf(items) && 0 < items.length) {
            this.win.confirm(_('Really remove selected?'), function(res) {
                if (!res) {
                    return;
                }

                if (this.lastDeleteRq) {
                    this.lastDeleteRq.cancel();
                }

                this.removeCombineSelectedBtn.startTip(t('Removing ...'));

                this.lastDeleteRq = new Request.JSON({url: _pathAdmin + this.win.getEntryPoint(),
                    noCache: 1, onComplete: function(res) {

                        this.removeCombineSelectedBtn.stopTip(t('Removed.'));
                        jarves.getAdminInterface().objectChanged(this.classProperties['object']);
                        this._deleteSuccess();

                    }.bind(this)}).get({
                        _method: 'delete',
                        pk: items
                    });
            }.bind(this));
        }
    },

    renderSideActionBar: function() {
        this.parent();
        var container = this.win.addSidebar();

        this.editAddSidebarContainer = new Element('div', {
            'class': 'jarves-WindowList-combine-sidebarContainer'
        }).inject(this.sideBarTitle, 'after');
    },

    isCombineLeftVisible: function() {
        return this.contentLayout.getTd(1, 1).getStyle('width').toInt() > 1;
    },

    displayCombineLeft: function(display) {
        if (display) {
            if (!this.isCombineLeftVisible()) {
                this.contentLayout.getTd(1, 1).setStyle('width', this.backupedLeftWidth);
            }
        } else {
            this.backupedLeftWidth = this.contentLayout.getTd(1, 1).getStyle('width');
            this.contentLayout.getTd(1, 1).setStyle('width', 1);
        }
    },

    leftItemsDown: function(pE) {
        if (!this.win.inFront) {
            return;
        }
        if (this.ready2ChangeThroughKeyboard == false) {
            return;
        }

        pE = new Event(pE);

        if (pE.key == 'down' || pE.key == 'up') {
            pE.stop();
        }

        var active = this.mainLeftItems.getElement('.active');
        var newTarget;

        if (pE.key == 'down') {

            if (active) {
                newTarget = active.getNext('.jarves-List-item');
            }

            if (!newTarget) {
                this.mainLeftItems.scrollTo(0, this.mainLeftItems.getScrollSize().y + 50);
            }

            /*if( !newTarget )
             newTarget = this.mainLeftItems.getElement('.jarves-List-item');
             */
        } else if (pE.key == 'up') {

            if (active) {
                newTarget = active.getPrevious('.jarves-List-item');
            }

            if (!newTarget) {
                this.mainLeftItems.scrollTo(0, 0);
            }

            /*
             if( !newTarget )
             newTarget = this.mainLeftItems.getLast('.jarves-List-item');
             */
        }

        if (!newTarget) {
            return;
        }

        var pos = newTarget.getPosition(this.mainLeftItems);
        var size = newTarget.getSize();

        var spos = this.mainLeftItems.getScroll();
        var ssize = this.mainLeftItems.getSize();

        var bottomline = spos.y + ssize.y;

        if (pos.y < 0) {
            this.mainLeftItems.scrollTo(0, spos.y + pos.y);
        } else if (pos.y + size.y > ssize.y) {
            //scroll down
            this.mainLeftItems.scrollTo(0, (pos.y + size.y) + spos.y - ssize.y);
        }

        this.loadItem(newTarget._item);

        this.checkScrollPosition(false, true);
    },

    checkClassProperties: function() {

        if (!this.classProperties.asNested) {
            return this.parent();
        }

        return true;
    },

    deselect: function() {
        if (this.mainLeftItems) {
            var active = this.mainLeftItems.getElement('.active');
            if (active) {
                active.removeClass('active');
            }
        }

        if (this.currentEdit) {
            this.currentEdit.destroy();
            delete this.currentEdit;
        }

        if (this.currentAdd) {
            this.currentAdd.destroy();
            delete this.currentAdd;
        }

        if (this.nestedField) {
            //deselect current trees
            this.nestedField.getFieldObject().deselect();
        }
    },

    renderTopActionBar: function() {
        this.parent();

        this.viewActionBar = new jarves.ButtonGroup(this.topActionBar);
        this.viewActionBar.inject(this.topActionBar, 'top');
        this.viewListBtn = this.viewActionBar.addIconButton(t('Grid'), '#icon-list-9', this.setView.bind(this, 'list'));

        this.viewCompactBtn = this.viewActionBar.addIconButton(t('Compact'), '#icon-layout', this.setView.bind(this, 'combine'));

        this.viewListBtn.setPressed(true);

        if (this.actionBarSearchBtn) {
            this.extraActionBar = new jarves.ButtonGroup(this.topActionBar);
            this.actionBarSearchBtn.inject(this.extraActionBar);
        }

    },

    renderActionBar: function() {
        this.parent();
    },

    isCombineView: function() {
        return 'list' !== this.currentViewType;
    },

    setView: function(viewType, withoutParamsSet, withoutAnimation) {
        var btn = 'list' === viewType ? this.viewListBtn : this.viewCompactBtn;
        var btnOther = 'list' === viewType ? this.viewCompactBtn : this.viewListBtn;

        if (this.currentViewType !== viewType) {
            this.currentViewType = viewType;

            if (this.lastViewFx) {
                this.lastViewFx.cancel();
            }

            var options = {
                transition: Fx.Transitions.Cubic.easeOut,
                duration: withoutAnimation ? 0 : 300
            };

            if ('list' === viewType) {
                if (this.addBtn) {
                    this.addBtn.setPressed(false);
                }

                this.actionBarNavigation.setStyle('display', 'block');
                this.editAddSidebarContainer.setStyle('display', 'none');

                if (Modernizr.csstransforms && Modernizr.csstransitions) {
                    this.container.addClass('jarves-windowCombine-list-show');
                    this.combineContainer.removeClass('jarves-windowCombine-combine-show');
                } else {

                    this.listContainer.setStyle('display', 'block');
                    this.listContainer.setStyle('visibility', 'visible');

                    this.lastViewFx = new Fx.Elements([
                        this.listContainer, this.actionBarNavigation, this.combineContainer
                    ], options).start({
                            0: {opacity: 1},
                            1: {opacity: 1},
                            2: {
                                left: 200,
                                right: -200,
                                opacity: 0
                            }
                        }).chain(function() {
                            this.combineContainer.setStyle('display', 'none');
                        }.bind(this));
                }

            } else {

                this.actionBarNavigation.setStyle('display', 'none');
                this.editAddSidebarContainer.setStyle('display', 'block');

                if (Modernizr.csstransforms && Modernizr.csstransitions) {
                    this.container.removeClass('jarves-windowCombine-list-show');
                    this.combineContainer.addClass('jarves-windowCombine-combine-show');
                } else {

                    this.combineContainer.setStyles({
                        display: 'block',
                        'opacity': 0,
                        visibility: 'visible',
                        left: 200,
                        right: -200
                    });

                    this.lastViewFx = new Fx.Elements([
                        this.listContainer, this.actionBarNavigation, this.combineContainer
                    ], options).start({
                            0: {opacity: 0},
                            1: {opacity: 0},
                            2: {
                                left: 0,
                                right: 0,
                                opacity: 1
                            }
                        }).chain(function() {
                            this.listContainer.setStyle('display', 'none');
                        }.bind(this));
                }

                if (!this.initialLoaded) {
                    this.initialLoaded = true;
                    this.loadItems(0, (this.classProperties.itemsPerPage) ? this.classProperties.itemsPerPage : 5);
                }
            }

            if (this.table)
                this.table.updateTableHeader();

            if (true !== withoutParamsSet) {
                this.setWinParams();
            }
        }

        btnOther.setPressed(false);
        btn.setPressed(true);
    },

    openAddItem: function() {
        this.setView('combine');
        this.add();
        this.setWinParams();
    },

    renderSearchPane: function() {
        this.searchIcon = new Element('div', {
            'class': 'jarves-WindowList-combine-searchicon icon-search-8',
            style: 'display: none'
        }).addEvent('click', this.toggleSearch.bind(this)).inject(this.mainLeftTop);

        this.sortSelect = new jarves.Select();
        this.sortSelect.inject(this.sortSpan);

        Object.each(this.classProperties.columns, function(column, id) {
            this.sortSelect.add(id + '______asc', [t(column.label), '#icon-arrow-up-3']);
            this.sortSelect.add(id + '______desc', [t(column.label), '#icon-arrow-down-3']);
        }.bind(this));

        this.sortSelect.addEvent('change', function() {
            var sortId = this.sortSelect.getValue();

            this.sortCombineField = sortId.split('______')[0];
            this.sortCombineDirection = sortId.split('______')[1];

            this.reload();
            this.setWinParams();
        }.bind(this));

        new Element('div', {style: 'color: gray; padding-left: 4px; padding-top:3px;', html: _('Use * as wildcard')}).inject(this.mainLeftSearch);

        var table = new Element('table').inject(this.mainLeftSearch);

        this.searchPane = new Element('tbody', {
        }).inject(table);

        this.searchFields = new Hash();
        var doSearchNow = false;

        if (this.classProperties.filter && this.classProperties.filter.each) {
            this.classProperties.filter.each(function(filter, key) {

                var mkey = key;

                if (typeOf(key) == 'number') {
                    mkey = filter;
                }

                var field = Object.clone(this.classProperties.filterFields[ mkey ]);

                var title = field.label;
                field.label = t(title);
                field.small = true;
                field.tableitem = true;
                field.tableItemLabelWidth = 50;

                var fieldObj = new jarves.Field(field, this.searchPane).addEvent('change', this.doSearch.bind(this));
                this.searchFields.set(mkey, fieldObj);

                if (field.type == 'select') {
                    if (field.multiple) {
                        new Element('option', {
                            value: '',
                            text: _('-- Please choose --')
                        }).inject(fieldObj.input, 'top');

                        fieldObj.setValue("");
                    } else {
                        fieldObj.select.add('', _('-- Please choose --'), 'top');
                        fieldObj.setValue('');
                    }
                }

                if (this.win.params && this.win.params.filter) {
                    Object.each(this.win.params.filter, function(item, key) {
                        if (item == mkey) {
                            fieldObj.setValue(this.win.params.item[key]);
                            doSearchNow = true;
                        }
                    }.bind(this));
                }

            }.bind(this));
        }

        if (doSearchNow) {
            this.toggleSearch();
            this.loadAlreadyTriggeredBySearch = true;
            this.doSearch();
        }
    },

    doSearch: function() {

        if (this.lastTimer) {
            clearTimeout(this.lastTimer);
        }

        var mySearch = function() {

            this.from = 0;
            this.loadedCount = 0;
            this._lastItems = null;

            this.reload();
        }.bind(this);
        this.lastTimer = mySearch.delay(200);
    },

    renderLoader: function() {

    },

    checkScrollPosition: function(pRecheck, pAndScrollToSelect) {
        if (this.loadingNewItems) {
            return;
        }

        if (this.mainLeftItems.getScroll().y - (this.mainLeftItems.getScrollSize().y - this.mainLeftItems.getSize().y) > 0) {
            this.loadMore(pAndScrollToSelect);
        } else if (this.maxItems > 0 && (this.mainLeftItems.getScrollSize().y - this.mainLeftItems.getSize().y) == 0) {
            this.loadMore(pAndScrollToSelect);
        }

        if (this.mainLeftItems.getScroll().y == 0) {
            this.loadPrevious(pAndScrollToSelect);
        }

        if (pRecheck == true) {
            this.checkScrollPosition.delay(50, this);
        }

    },

    loadMore: function(pAndScrollToSelect) {
        if (this.loadedCount < this.maxItems) {
            this.loadItems(this.loadedCount, (this.classProperties.itemsPerPage) ? this.classProperties.itemsPerPage : 5, pAndScrollToSelect);
        }
    },

    loadPrevious: function(pAndScrollToSelect) {
        if (this.from > 0) {

            var items = (this.classProperties.itemsPerPage) ? this.classProperties.itemsPerPage : 5;
            var newFrom = this.from - items;
            var items = items;

            if (newFrom < 0) {
                items += newFrom;
                newFrom = 0;
            }
            this.loadItems(newFrom, items, pAndScrollToSelect);
        }
    },

    changeLanguage: function() {
        this.reload();
    },

    clear: function() {

        if (this.classProperties.asNested) {

            this.mainLeft.empty();

        } else {
            this._lastItems = null;
            this.clearItemList();
            this.from = 0;
            this.loadedCount = 0; //(this.classProperties.itemsPerPage)?this.classProperties.itemsPerPage:5;
        }

    },

    reload: function() {
        if (this.ignoreNextSoftLoad) {
            delete this.ignoreNextSoftLoad;
            return;
        }

        this.parent();
        if (this.classProperties.asNested) {
            return this.renderLayoutNested(this.treeContainer);
        } else {
            this.clear();
            this.maxItems = null;
            this.parent();
            return this.loadItems(this.from, this.loadedCount);
        }
    },

    loadItems: function(pFrom, pMax, pAndScrollToSelect) {
        if (this.classProperties.asNested) {
            return;
        }

        if (this.maxItems === null) {
            return this.loadCount(function(count) {
                if (count == 0) {
                    this.itemLoaderNoItems();
                } else {
                    this.loadItems(pFrom, pMax, pAndScrollToSelect);
                }

            }.bind(this));
        }

        if (this._lastItems) {
            if (pFrom > this._lastItems.count) {
                return;
            }
        }

        pMax = (pMax > 0) ? pMax : 5;

        if (this.lastRequest) {
            this.lastRequest.cancel();
        }

        if (this.from == null || pFrom >= this.from) {
            this.itemLoaderStart();
        } else {
            this.prevItemLoaderStart();
        }

        if (this.loader) {
            this.loader.show();
        }

        this.order = {};
        this.order[this.sortCombineField] = this.sortCombineDirection;

        this.lastRequest = new Request.JSON({url: _pathAdmin + this.getEntryPoint(),
            noCache: true, onComplete: function(response) {

                if (response.error) {
                    this.itemLoader.set('html', t('Something went wrong :-('));
                    return;
                }

                if (typeOf(response.data) != 'array') {
                    response.data = [];
                }

                var count = response.data.length;

                if (!count && (this.from == 0 || !this.from)) {
                    this.itemLoaderNoItems();
                }

                if (!Object.getLength(response.data)) {
                    return;
                }

                this.renderCombineItems(response.data, pFrom);

                if (this.from == null || pFrom < this.from) {
                    this.from = pFrom;
                } else if (pFrom == null) {
                    this.from = 0;
                }

                if (!this.loadedCount || this.loadedCount < pFrom + count) {
                    this.loadedCount = pFrom + count;
                }

                if (count > 0) {
                    if (this.loadedCount == this.maxItems) {
                        this.itemLoaderEnd();
                    } else {
                        this.itemLoaderStop();
                    }
                } else {
                    this.itemLoaderNoItems();
                }

                if (this.from > 0) {
                    this.prevItemLoaderStop();
                } else {
                    this.prevItemLoaderNoItems();
                }

                this.itemsFrom.set('html', this.from + 1);
                this.itemsLoaded.set('html', this.loadedCount);

                if (pAndScrollToSelect) {
                    var target = this.mainLeftItems.getElement('.active');
                    if (target) {
                        var pos = target.getPosition(this.mainLeftItems);

                        this.mainLeftItems.scrollTo(0, pos.y - (this.mainLeftItems.getSize().y / 2));

                    }
                } else {
                    if (this.from > 0) {
                        if (this.mainLeftItems.getScroll().y < 5) {
                            this.mainLeftItems.scrollTo(0, 5);
                        }
                    }
                }

                this.checkScrollPosition(false, pAndScrollToSelect);

                if (this.setViewToCombine) {
                    this.setView('combine');
                    delete this.setViewToCombine;
                }
            }.bind(this)}).get({
                offset: pFrom,
                limit: pMax,
                order: this.order,
                lang: (this.languageSelect) ? this.languageSelect.getValue() : false
            });
    },

    loadCount: function(pCallback) {

        if (this.lastCountRequest) {
            this.lastCountRequest.cancel();
        }

        this.lastCountRequest = new Request.JSON({url: _pathAdmin + this.getEntryPoint() + '/:count',
            onComplete: function(response) {

                this.maxItems = response.data + 0;
                if (this.itemsMaxSpan) {
                    this.itemsMaxSpan.set('html', this.maxItems);
                }

                if (pCallback) {
                    pCallback(response.data);
                }

            }.bind(this)}).get();

    },

    clearItemList: function() {
        this.lastSortValue = false;
        this.itemsLoadedCount = 0;

        this.from = null;
        this.loadedCount = 0;

        this.combineCheckboxes = [];

        this._lastItems = null;

        this.mainLeftItems.empty();

        this.createItemLoader();
    },

    createItemLoader: function() {
        this.itemLoader = new Element('div', {
            'class': 'jarves-WindowList-combine-itemloader'
        }).inject(this.mainLeftItems);

        this.prevItemLoader = new Element('div', {
            'class': 'jarves-WindowList-combine-itemloader',
            'style': 'display: none;'
        }).inject(this.mainLeftItems, 'top');

        this.itemLoaderStop();

    },

    itemLoaderStop: function() {
        this.loadingNewItems = false;
        if (!this.itemLoader) {
            return;
        }
        this.itemLoader.set('html', _('Scroll to the bottom to load more entries.'));
    },

    itemLoaderEnd: function() {
        this.loadingNewItems = false;
        if (!this.itemLoader) {
            return;
        }
        this.itemLoader.set('html', _('No entries left.'));
    },

    itemLoaderStart: function() {
        this.loadingNewItems = true;
        if (!this.itemLoader) {
            return;
        }
        new jarves.Loader(this.itemLoader);
    },

    itemLoaderNoItems: function() {
        this.itemLoader.set('html', _('There are no entries.'));
    },

    prevItemLoaderStart: function() {
        this.loadingNewItems = true;
        if (!this.prevItemLoader) {
            return;
        }
        this.prevItemLoader.set('html', '<img src="' + _path + 'bundles/jarves/admin/images/loading.gif" />' + '<br />' + _('Loading entries ...'));
    },

    prevItemLoaderStop: function() {
        this.prevLoadingNewItems = false;
        if (!this.prevItemLoader) {
            return;
        }
        this.prevItemLoader.setStyle('display', 'block');
        this.prevItemLoader.set('html', _('Scroll to the top to load previous entries.'));
    },

    prevItemLoaderNoItems: function() {
        this.loadingNewItems = false;
        this.prevItemLoader.setStyle('display', 'none');
    },

    toggleSearch: function() {

        if (!this.searchOpened) {
            this.searchEnable = 1;
            this.searchIcon.addClass('jarves-WindowList-combine-searchicon-active');
            this.mainLeftSearch.tween('height', this.searchPaneHeight);
            this.mainLeftSearch.setStyle('border-bottom', '1px solid silver');
            this.mainLeftItems.tween('top', 36 + this.searchPaneHeight + 1);
            this.searchOpened = true;
            this.doSearch();
        } else {

            this.searchEnable = 0;
            this.searchIcon.removeClass('jarves-WindowList-combine-searchicon-active');

            new Fx.Tween(this.mainLeftSearch).start('height', 0).chain(function() {
                this.mainLeftSearch.setStyle('border-bottom', '0px');
                this.checkScrollPosition();
            }.bind(this));

            this.mainLeftItems.tween('top', 36);
            this.searchOpened = false;
            this.reload();
        }

    },

    findSplit: function(pSplitTitle) {
        var res = false;

        var splits = this.mainLeftItems.getElements('.jarves-List-split');
        splits.each(function(item, id) {

            if (item.get('html') == pSplitTitle) {
                res = item;
            }

        }.bind(this));

        return res;
    },

    nestedItemSelected: function(pItem, pDom) {
        //pDom.objectKey
        //pDom.id
        //pDom.url
        if (pDom.objectKey == this.classProperties.object) {
            this.loadItem(pItem, pDom.objectKey);
        } else {
            this.loadRootItem(pItem, pDom.objectKey);
        }
    },

    renderCombineItems: function(pItems, pFrom) {
        this._lastItems = pItems;

        this.tempcount = 0;

        if (pItems) {

            var position = pFrom + 0;

            Array.each(pItems, function(item) {

                this.itemsLoadedCount++;
                position++;

                var splitTitle = this.getSplitTitle(item);

                var res = this.addCombineItem(item);
                res.store('position', position + 0);

                if (this.from == null || pFrom > this.from) {

                    /*if( this.lastSortValue != splitTitle ){

                     this.lastSortValue = splitTitle;

                     var split = this.addSplitTitle( splitTitle );
                     split.inject( this.itemLoader, 'before' );
                     }*/

                    res.inject(this.itemLoader, 'before');

                    var split = res.getPrevious('.jarves-List-split');

                    if (split) {
                        if (split.get('html') != splitTitle) {
                            var split = this.addSplitTitle(splitTitle);
                            split.inject(res, 'before');
                        }
                    } else {
                        var split = this.addSplitTitle(splitTitle);
                        split.inject(res, 'before');
                    }

                } else {

                    res.inject(this.prevItemLoader, 'before');

                    var split = res.getNext('.jarves-List-split');

                    var found = true;

                    if (split) {
                        if (split.get('html') != splitTitle) {
                            found = false;
                        } else {
                            res.inject(split, 'after');
                        }
                    } else {
                        found = false;
                    }

                    if (!found) {
                        var split = res.getPrevious('.jarves-List-split');
                        if (split) {
                            if (split.get('html') != splitTitle) {
                                var split = this.addSplitTitle(splitTitle);
                                split.inject(res, 'before');
                            }
                        } else {
                            var split = this.addSplitTitle(splitTitle);
                            split.inject(res, 'before');
                        }
                    }

                }

                if (res.hasClass('active')) {
                    this.lastItemPosition = position + 0;
                }

                this.tempcount++;
            }.bind(this));
        }

        this.prevItemLoader.inject(this.mainLeftItems, 'top');

    },

    getSplitTitle: function(pItem) {

        var value = jarves.getObjectFieldLabel(pItem, this.classProperties.columns[this.sortCombineField], this.sortCombineField, this.classProperties['object']);
        if (value == '') {
            return _('-- No value --');
        }

        if (!this.classProperties.columns[this.sortCombineField]) {
            return value;
        }

        if (!this.classProperties.columns[this.sortCombineField]['type'] || this.classProperties.columns[this.sortCombineField].type == "text") {

            return '<b>' + ((typeOf(value) == 'string') ? value.substr(0, 1).toUpperCase() : value) + '</b>';

        } else {

            if (["datetime", "date"].contains(this.classProperties.columns[this.sortCombineField]['type'])) {

                if (pItem[this.sortCombineField] > 0) {

                    var time = new Date(pItem[this.sortCombineField] * 1000);
                    value = time.timeDiffInWords();

                } else {
                    value = t('No value');
                }

            }
            return value;
        }

    },

    add: function() {
        if (this.addBtn) {
            this.addBtn.setPressed(true);
        }

        if (this.addRootBtn) {
            this.addRootBtn.setPressed(false);
        }

        this.lastItemPosition = null;
        this.currentItem = null;

        this.deselect();

        if (this.currentEdit) {
            this.currentEdit.destroy();
            delete this.currentEdit;
        }

        if (this.currentAdd) {
            this.currentAdd.destroy();
            delete this.currentAdd;
        }

        if (this.currentRootAdd) {
            this.currentRootAdd.destroy();
            delete this.currentRootAdd;
        }

        if (this.currentRootEdit) {
            this.currentRootEdit.destroy();
            delete this.currentRootEdit;
        }

        var win = {};
        for (var i in this.win) {
            win[i] = this.win[i];
        }

        win.entryPoint = jarves.entrypoint.getRelative(this.getEntryPoint(), this.classProperties.editEntrypoint);

        win.getSidebar = function() {
            return this.editAddSidebarContainer;
        }.bind(this);

        this.currentAdd = new jarves.WindowAdd(win, this.mainRight);
        this.currentAdd.addEvent('add', this.addSaved.bind(this));
        this.currentAdd.addEvent('addMultiple', this.addSavedMultiple.bind(this));

        this.setWinParams();
    },

    addNestedRoot: function() {

        if (this.addBtn) {
            this.addBtn.setPressed(false);
        }

        if (this.addRootBtn) {
            this.addRootBtn.setPressed(true);
        }

        this.lastItemPosition = null;
        this.currentItem = null;

        this.deselect();

        if (this.currentEdit) {
            this.currentEdit.destroy();
            delete this.currentEdit;
        }

        if (this.currentAdd) {
            this.currentAdd.destroy();
            delete this.currentAdd;
        }

        if (this.currentRootEdit) {
            this.currentRootEdit.destroy();
            delete this.currentRootEdit;
        }

        if (this.currentAdd) {
            this.currentAdd.destroy();
            delete this.currentAdd;
        }

        var win = {};
        for (var i in this.win) {
            win[i] = this.win[i];
        }

        win.entryPoint = jarves.entrypoint.getRelative(this.getEntryPoint(), this.classProperties.nestedRootAddEntrypoint);

        win.getSidebar = function() {
            return this.editAddSidebarContainer;
        }.bind(this);

        this.currentRootAdd = new jarves.WindowAdd(win, this.mainRight);
        this.currentRootAdd.addEvent('add', this.addRootSaved.bind(this));
        this.currentRootAdd.addEvent('addMultiple', this.addRootSaved.bind(this));

    },

    addRootSaved: function(request, response) {
        this.changeLanguage();
    },

    addSavedMultiple: function(request, response) {
        //since multiple insertion returns a array as response.data, we need to make it
        //compatible with the addSaved method. We select now the first added item.
        if ('array' === typeOf(response.data)) {
            response.data = response.data[0];
        }
        this.addSaved(request, response);
    },

    addSaved: function(pRequest, pResponse) {
        this.ignoreNextSoftLoad = true;

        if (this.currentAdd.classProperties.primary.length > 1) {
            return;
        }

        this.lastLoadedItem = null;
        this._lastItems = null;

        this.win.setParameters({
            selected: jarves.normalizeObjectKey(this.classProperties['object']) + '/' + jarves.getObjectUrlId(this.classProperties['object'], pResponse.data)
        });

        this.needSelection = true;
        if (this.classProperties.asNested) {
            if (pRequest._position == 'first') {
                this.nestedField.getFieldObject().reloadBranch(pRequest._pk, pRequest._targetObjectKey);
            } else {
                this.nestedField.getFieldObject().reloadParentBranch(pRequest._pk, pRequest._targetObjectKey);
            }
        } else {
            return this.loadCount(function(count) {
                this.loadAround(this.win.params.selected);
            }.bind(this));
        }
    },

    toggleRemove: function() {
        if (!this.inRemoveMode) {
            this.mainLeftItems.addClass('remove-activated');
            this.inRemoveMode = true;
            this.mainLeftDeleter.tween('height', 29);
            this.mainLeftItems.tween('bottom', 30);
            this.toggleRemoveBtn.setPressed(true);
        } else {
            this.mainLeftItems.removeClass('remove-activated');
            this.inRemoveMode = false;
            this.mainLeftDeleter.tween('height', 0);
            this.mainLeftItems.tween('bottom', 0);
            this.toggleRemoveBtn.setPressed(false);
        }
    },

    getRefWin: function() {
        var res = {};
        Object.each([
            'addEvent', 'removeEvent', 'extendHead', 'addSmallTabGroup', 'addButtonGroup', 'border', 'inlineContainer', 'titleGroups', 'id', 'close', 'setTitle', '_confirm', 'interruptClose'
        ], function(id) {
            res[id] = this.win[id];
            if (typeOf(this.win[id]) == 'function') {
                res[id] = this.win[id].bind(this.win);
            } else {
                res[id] = this.win[id];
            }
        }.bind(this));
        return res;
    },

    openEditItem: function(pItem) {
        this.setView('combine');
        this.loadItem(pItem);
    },

    loadItem: function(pk, objectKey) {
        var _this = this;

        if (!objectKey) {
            objectKey = this.classProperties['object'];
        }

        this.needSelection = false;

        if (this.currentAdd) {
            //TODO check unsaved
            var hasUnsaved = this.currentAdd.hasUnsavedChanges();
            this.currentAdd.destroy();
            this.currentAdd = null;
        }

        if (this.currentRootEdit) {
            this.currentRootEdit.destroy();
            this.currentRootEdit = null;
        }

        if (this.currentRootAdd) {
            this.currentRootAdd.destroy();
            delete this.currentRootAdd;
        }

        if (!this.currentEdit) {

            this.setActiveItem(pk, objectKey);
            if (this.addBtn) {
                this.addBtn.setPressed(false);
            }
            if (this.addRootBtn) {
                this.addRootBtn.setPressed(false);
            }

            var win = {};

            for (var i in this.win) {
                win[i] = this.win[i];
            }

            win.entryPoint = jarves.entrypoint.getRelative(this.win.entryPoint, _this.classProperties.editEntrypoint);
            win.params = {item: pk};
            win.getSidebar = function() {
                return this.editAddSidebarContainer;
            }.bind(this);

            win.close = function() {

            };

            this.currentEdit = new jarves.WindowEdit(win, this.mainRight);

            this.currentEdit.addEvent('save', this.saved.bind(this));
            this.currentEdit.addEvent('load', this.itemLoaded.bind(this));
            this.currentEdit.addEvent('remove', function() {
                this.deselect();
                this.reload();
            }.bind(this));

        } else {
            var hasUnsaved = this.currentEdit.hasUnsavedChanges();

            if (hasUnsaved) {
                this.win.interruptClose = true;
                this.win._confirm(t('There are unsaved data. Want to continue?'), function(pAccepted) {
                    if (pAccepted) {
                        this.currentEdit.winParams = {item: pk};
                        this.currentEdit.loadItem();

                        if (this.addBtn) {
                            this.addBtn.setPressed(false);
                        }

                        this.setActiveItem(pk, objectKey);
                    }
                }.bind(this));
                return;
            } else {
                this.currentEdit.winParams = {item: pk};
                this.currentEdit.loadItem();

                if (this.addBtn) {
                    this.addBtn.setPressed(false);
                }

                this.setActiveItem(pk, objectKey);
            }

        }
    },

    loadRootItem: function(pItem, objectKey) {
        if (this.currentAdd) {
            //TODO check unsaved
            var hasUnsaved = this.currentAdd.hasUnsavedChanges();
            this.currentAdd.destroy();
            this.currentAdd = null;
        }

        if (this.currentEdit) {
            this.currentEdit.destroy();
            this.currentEdit = null;
        }

        if (!this.currentRootEdit) {
            this.setActiveItem(pItem, objectKey);

            if (this.addBtn) {
                this.addBtn.setPressed(false);
            }

            if (this.addRootBtn) {
                this.addRootBtn.setPressed(false);
            }

            var win = {};

            for (var i in this.win) {
                win[i] = this.win[i];
            }

            win.entryPoint = jarves.entrypoint.getRelative(this.win.entryPoint, this.classProperties.nestedRootEditEntrypoint);
            win.params = {item: pItem};
            win.getSidebar = function() {
                return this.editAddSidebarContainer;
            }.bind(this);

            this.currentRootEdit = new jarves.WindowEdit(win, this.mainRight);

            this.currentRootEdit.addEvent('save', this.saved.bind(this));
            this.currentRootEdit.addEvent('load', this.itemLoaded.bind(this));

        } else {

            var hasUnsaved = false && this.currentRootEdit.hasUnsavedChanges(); //todo. debugging

            if (hasUnsaved) {
                this.win.interruptClose = true;
                this.win._confirm(t('There are unsaved data. Want to continue?'), function(pAccepted) {
                    if (pAccepted) {
                        this.currentRootEdit.winParams = {item: pItem};
                        this.currentRootEdit.loadItem();

                        if (this.addBtn) {
                            this.addBtn.setPressed(false);
                        }

                        this.setActiveItem(pItem, objectKey);
                    }
                }.bind(this));
                return;
            } else {
                this.currentRootEdit.winParams = {item: pItem};
                this.currentRootEdit.loadItem();

                if (this.addBtn) {
                    this.addBtn.setPressed(false);
                }

                this.setActiveItem(pItem, objectKey);
            }

        }
    },

    setActiveItem: function(pItem, objectKey) {
        this.currentItem = pItem;
        this.selected = jarves.normalizeObjectKey(objectKey) + '/' + jarves.getObjectUrlId(objectKey, pItem);
        this.currentItemObjectKey = objectKey;
        this.selectItem(pItem, objectKey);
    },

    selectItem: function(pItem, objectKey) {
        var pk = pItem;
        if ('string' !== typeOf(pk)) {
            objectKey = objectKey || this.classProperties['object'];
            pk = jarves.normalizeObjectKey(objectKey) + '/' + jarves.getObjectUrlId(objectKey, pItem);
        }

        if (this.classProperties.asNested) {
            if (this.nestedField) {
                this.nestedField.getFieldObject().select(pk);
            }
        } else {
            this.mainLeftItems.getChildren().each(function(item, i) {
                item.removeClass('active');
                if (item._pk == pk) {
                    item.addClass('active');
                }
            });
        }
    },

    itemLoaded: function(pItem) {
        this.lastLoadedItem = pItem;
        this.setWinParams();
        this.setView('combine');
    },

    renderFinished: function() {
        this.parent();

        if (this.win.params && this.win.params.list && this.win.params.list.language && this.languageSelect) {
            this.languageSelect.setValue(this.win.params.list.language);
        }

        this.setView('list', true, true);

        if (this.win.params && this.win.params.list && this.win.params.list.combineOrder) {
            Object.each(this.win.params.list.combineOrder, function(order, field) {
                this.sortCombineField = field;
                this.sortCombineDirection = order;
            }.bind(this));
        } else {
            this.sortCombineField = this.sortField;
            this.sortComineDirection = this.sortDirection;
        }

        if (!this.sortComineDirection) this.sortComineDirection = 'asc';
        if (this.sortSelect) {
            this.sortSelect.setValue(this.sortCombineField + '______' + ((this.sortComineDirection.toLowerCase() == 'desc') ? 'desc' : 'asc'));
        }

        if (this.classProperties.asNested) {
            if (this.win.params && this.win.params.selected) {
                this.setView('combine', true, true);
                this.nestedField.getFieldObject().select(this.win.params.selected);
            }
        } else {
            if (this.win.params && this.win.params.selected) {
                this.needSelection = true;
                this.loadAround(this.win.params.selected);
            }
        }
        if (this.win.getParameter('type') && 'list' != this.win.getParameter('type')) {
            this.setView('combine', true, true);
            if ('add' === this.win.getParameter('type')) {
                this.add();
            }
            if ('rootAdd' === this.win.getParameter('type')) {
                this.addNestedRoot();
            }
        } else if (!this.win.getParameter('type') && this.classProperties.startCombine) {
            this.setView('combine', true, true);
        }
    },

    setWinParams: function() {
        var selected = null;
        var params = {};
        params['list'] = this.parent();

        if (this.currentViewType) {
            if ('list' === this.currentViewType) {
                params.type = 'list';
            } else {
                if ((this.currentEdit || this.currentRootEdit)) {

                    var classProperties = this.currentRootEdit ? this.currentRootEdit.classProperties : this.currentEdit.classProperties;
                    if (classProperties) {
                        selected = jarves.normalizeObjectKey(classProperties['object']) + '/' + jarves.getObjectUrlId(classProperties['object'], this.currentItem);
                        params.type = this.currentRootEdit ? 'rootEdit' : 'edit';
                    }
                } else if (this.currentAdd || this.currentRootAdd) {
                    params.type = this.currentRootAdd ? 'rootAdd' : 'add';
                } else {
                    params.type = 'combine';
                }
            }

            if (this.sortCombineField) {
                var order = {};
                order[this.sortCombineField] = this.sortCombineDirection;
                params.list.combineOrder = order;
            }
        }

        if (this.languageSelect) {
            if (!params.list) params.list = {};
            params.list.language = this.languageSelect.getValue();
        }

        if (selected) {
            params.selected = selected;
        }

        this.win.setParameters(params);
        return params;
    },

    reloadAll: function() {
        this.loadItems(this.from, this.loadedCount);
    },

    getEntryPoint: function() {
        return this.win.getEntryPoint();
    },

    loadAround: function(pPrimary) {
        if (this.lastLoadAroundRequest) {
            this.lastLoadAroundRequest.cancel();
        }

        this.setViewToCombine = true;
        this.order = {};
        this.order[this.sortCombineField] = this.sortCombineDirection;
        var id = jarves.getCroppedObjectId(pPrimary);
        var url = _pathAdmin + this.getEntryPoint() + '/' + id + '/:position';

        this.lastLoadAroundRequest = new Request.JSON({url: url, noCache: true, onComplete: function(response) {
            var position = response.data;

            if (typeOf(position) == 'number') {
                var range = (this.classProperties.itemsPerPage) ? this.classProperties.itemsPerPage : 5;

                var from = position;
                if (position < range) {
                    from = 0;
                } else {
                    from = position - Math.floor(range / 2);
                }

                this.clearItemList();
                this.loadItems(from, range);
            } else {
                this.loadItems(0, 1);
            }

        }.bind(this)}).get({
                order: this.order,
                filter: this.searchEnable,
                lang: (this.languageSelect) ? this.languageSelect.getValue() : null,
                filterVals: (this.searchEnable) ? this.getSearchVals() : null
            });
    },

    saved: function(pItem, pRes) {
        this.ignoreNextSoftLoad = true;

        if (this.classProperties.asNested) {

            this.reloadTreeItem();

        } else {
            this.lastLoadedItem = pItem;
            this._lastItems = null;

            this.loadAround(this.win.params.selected);
        }
    },

    reloadTreeItem: function() {
        var selected = this.nestedField.getFieldObject().getSelectedTree();
        if (selected) {
            selected.reloadParentOfActive();
        }
    },

    /*
     renderTopTabGroup: function(){
     if( !this.topTabGroup ) return;
     this.topTabGroup.setStyle('left', 158);
     },*/

    addSplitTitle: function(pItem) {
        return new Element('div', {
            'class': 'jarves-List-split',
            html: pItem
        });
    },

    addCombineItem: function(pItem) {
        var layout = '';
        var titleAdded, nameAdded;

        var pk = jarves.normalizeObjectKey(this.classProperties['object']) + '/' + jarves.getObjectUrlId(this.classProperties['object'], pItem);

        if (this.classProperties.itemLayout) {
            layout = this.classProperties.itemLayout;
        } else {

            if (this.classProperties.columns.title) {
                layout += '<h2>{title}</h2>';
                titleAdded = true;
            } else if (this.classProperties.columns.name) {
                layout += '<h2>{name}</h2>';
                nameAdded = true;
            }

            layout += '<div class="subline">';

            var c = 1;
            Object.each(this.classProperties.columns, function(bla, id) {

                if (id == "title" && titleAdded) {
                    return;
                }
                if (id == "name" && nameAdded) {
                    return;
                }

                if (c > 2) {
                    return;
                }

                if (c == 2) {
                    layout += ', ';
                }

                layout += "<span>{" + id + "}</span>";
                c++;

            }.bind(this));

            layout += "</div>";
        }

        var item = new Element('div', {
            html: layout,
            'class': 'jarves-List-item' + (this.classProperties.edit ? ' editable' : '')
        });
        item._item = pItem;
        item._pk = pk;

        //parse template
        var data = jarves.getObjectLabels(this.classProperties.columns, pItem, this.classProperties['object'], true);

        mowla.render(item, data);

        if (this.classProperties.remove == true) {

            if (pItem._deletable) {

                var removeBox = new Element('div', {
                    'class': 'jarves-List-item-remove'
                }).inject(item);

                var removeCheckBox = new Element('div', {
                    'class': 'jarves-List-item-removeCheck'
                }).inject(removeBox);

                var checkbox = new Element('input', {
                    value: jarves.getObjectUrlId(this.classProperties['object'], pItem),
                    type: 'checkbox'
                }).addEvent('click',function(e) {
                        e.stopPropagation();
                    }).inject(removeCheckBox);

                this.combineCheckboxes.include(checkbox);
            }
        }

        if (this.currentEdit && this.currentEdit.classProperties) {

            var oneIsFalse = false;

            this.currentEdit.classProperties.primary.each(function(prim) {
                if (this.currentItem[prim] != pItem[prim]) {
                    oneIsFalse = true;
                }
            }.bind(this))

            if (oneIsFalse == false) {
                item.addClass('active');
            }
        }

        if (this.needSelection) {
            if (this.win.params.selected == pk) {
                item.fireEvent('click', pItem);
                item.addClass('active');
                this.loadItem(pItem, jarves.normalizeObjectKey(this.classProperties['object']));
            }
        }

        return item;
    }

});
