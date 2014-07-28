jarves.ObjectTree = new Class({

    Implements: [Options, Events],
    Extends: jarves.Base,
    Binds: ['getItem', 'select', 'deselect'],
    ready: false,

    options: {
        /**
         *
         *
         * @var {String}
         */
        objectKey: '',

        /**
         * Changes the rest interface url to the given entryPoint.
         * It's then `jarves/<entryPoint>` otherwise the default is used `jarves/object/<objectKey>/`.
         *
         * @var {String}
         */
        entryPoint: '',

        /**
         * The pk value of the scope.
         * @var {String}
         */
        scope: null,

        /**
         * if the object behind the scope (RootAsObject) is multiLanguage, we can filter by it.
         *
         * @var {Boolean}
         */
        scopeLanguage: null,

        /**
         * TODO, can be useful
         * @var [Boolean}
         */
        scopeCondition: false,

        /**
         * Enables the drag'n'drop moving.
         *
         * @var {Boolean}
         */
        moveable: true,

        /**
         * Enables the 'add'-icon.
         * @var {Boolean}
         */
        withObjectAdd: false,

        /**
         * The icon of the add-icon
         * @var {String}
         */
        iconAdd: 'bundles/admin/images/icons/add.png',

        icon: null,

        /**
         * Enables the opening of the first level during the first load.
         *
         * @var {Boolean}
         */
        openFirstLevel: null,

        /**
         * If you want to change the root object. That's not very often the case.
         * @var {String}
         */
        rootObject: null,

        /**
         * Enables the context menu (edit, delete etc.)
         * @var {Boolean}
         */
        withContext: true,

        /**
         * Initial selects the object of the given pk.
         *
         * @var {String}
         */
        selectObject: null,

        /**
         * @var {Object}
         */
        iconMap: null,

        /**
         * Enabled the selection.
         * @var {Boolean}
         */
        selectable: true,

        treeInterface: '',

        treeInterfaceClass: '',

        labelTemplate: null,
        objectFields: '',

        treeContainerSelector: '.jarves-objectTree-container'

    },

    dndOnlyInside: false,

    loadChildrenRequests: {},

    loadingDone: false,
    firstLevelLoaded: false,
    firstLoadDone: false,

    load_object_children: false,
    domainA: false,
    activeLoadings: 0,

    rootObject: {}, //copy of current root object
    rootLoaded: false,

    //contains the open state of the objects
    opens: {},

    objectDefinition: null,

    lastRootItems: [],

    initialize: function(container, options, refs) {
        this.items = {};

        this.setOptions(options);
        this.container = container;

        if (this.options.objectKey) {
            this.options.objectKey = jarves.normalizeObjectKey(this.options.objectKey);
            this.objectDefinition = jarves.getObjectDefinition(this.options.objectKey);
        } else {
            throw '`objectKey` in jarves.ObjectTree is required.';
        }

        if (this.options.rootObject) {
            this.options.rootObject = jarves.normalizeObjectKey(this.options.rootObject);
        }

        this.definition = this.objectDefinition;

        this.options.objectKey = jarves.normalizeObjectKey(this.options.objectKey);

        if (this.options.objectKey && !this.objectDefinition) {
            throw 'Object not found: ' + this.options.objectKey;
        }

        if (!this.options.rootObject) {
            this.options.rootObject = this.definition.nestedRootObject;
        }

        if (!this.options.treeInterface) {
            this.options.treeInterface = this.definition.treeInterface;
        }

        if (!this.options.treeInterfaceClass) {
            this.options.treeInterfaceClass = this.definition.treeInterfaceClass;
        }

        if (null === this.options.moveable) {
            this.options.moveable = typeOf(this.definition.treeMoveable) !== 'null' ? this.definition.treeMoveable : true;
        }

        var fields = [];
        if (this.options.objectFields) {
            fields = this.options.objectFields;
        } else if (this.options.objectLabel) {
            fields.push(this.options.objectLabel);
        } else if (this.objectDefinition) {
            fields.push(this.objectDefinition.objectLabel);
        }

        if (typeOf(fields) == 'string') {
            fields = fields.replace(/[^a-zA-Z0-9_]/g, '').split(',');
        }
        this.objectFields = fields;

        if (!this.objectDefinition.nested) {
            throw 'Object is not a nested set ' + this.options.objectKey;
        }

        this.primaryKey = jarves.getObjectPrimaryKey(this.options.objectKey);

        if (!this.primaryKey) {
            throw 'Object has no primary key: ' + this.options.objectKey;
        }

        if (!this.options.iconMap) {
            this.options.iconMap = this.objectDefinition.treeIconMapping;
        }

        if (this.objectDefinition && this.objectDefinition.nestedRootAsObject) {
            if (!this.options.rootObject) {
                this.options.rootObject = this.objectDefinition.nestedRootObject;
            }
        }

        if (Cookie.read('jarvesObjectTree_' + this.options.objectKey)) {
            var opens = Cookie.read('jarvesObjectTree_' + this.options.objectKey);
            opens = opens.split('.');
            Array.each(opens, function(open) {
                this.opens[ open ] = true;
            }.bind(this));
        }

        if (refs) {
            this.options.objectObj = refs.objectObj;
            this.options.win = refs.win;
        }

        this.main = new Element('div', {
            'class': 'jarves-objectTree'
        }).inject(this.container);

        if (this.objectDefinition.nestedRootAsObject) {
            this.topDummy = new Element('div', {
                'class': 'jarves-objectTree-top-dummy'
            }).inject(this.main);
        }

        this.paneObjects = new Element('div', {
            'class': 'jarves-objectTree-objects'
        }).inject(this.main);

        if (this.options.win) {
            this.options.win.addEvent('resize', this.setRootPosition.bind(this));
        }

        if (this.container.getParent(this.options.treeContainerSelector)) {
            this.rootContainer = this.container.getParent(this.options.treeContainerSelector);
            this.rootContainer.addEvent('scroll', this.setRootPosition.bind(this));
        } else {
            this.rootContainer = this.container;
            this.container.addEvent('scroll', this.setRootPosition.bind(this));
        }

        this.paneObjects.addClass('jarves-objectTree-objects-show')

        this.paneRoot = new Element('div', {
            'class': 'jarves-objectTree-root'
        }).inject(this.main);

        this.paneRoot.set('morph', {duration: 200});

        var objectKey;
        if (this.options.selectObject) {
            objectKey = jarves.getCroppedObjectKey(this.options.selectObject);
        }

        if (this.options.selectObject && (!objectKey || objectKey == this.options.objectKey || objectKey == this.options.rootObject)) {
            this.selected = this.options.selectObject;
            if (!objectKey) {
                this.selected = objectKey + '/' + this.selected;
            }
            this.startupWithObjectInfo(this.selected);
        } else {
            this.loadFirstLevel();
        }

        if (container && container.getParent('.kwindow-border')) {
            container.getParent('.kwindow-border').windowInstance.addEvent('close', this.clean.bind(this));
        }

        window.addEvent('mouseup', this.destroyContext.bind(this));

        this.main.addEvent('click:relay(.jarves-objectTree-item-toggler)', this.onTogglerClick.bind(this));
        this.main.addEvent('click:relay(.jarves-objectTree-item)', this.onClick.bind(this));
        this.main.addEvent('mousedown', this.onMousedown.bind(this));
    },

    getUrl: function() {
        return _pathAdmin + (this.options.entryPoint ? this.options.entryPoint : 'object/' + jarves.normalizeObjectKey(this.options.objectKey) ) + '/';
    },

    /**
     *
     * @param {String} pId String (already encoded) or object.
     * @param {Function} pCallback
     */
    startupWithObjectInfo: function(pId, pCallback) {
        var objectKey = this.options.objectKey;
        if ('object' === typeOf(pId)) {
            pId = jarves.getObjectUrlId(this.options.objectKey, pId);
        } else {
            //we assume its a objectUrl
            objectKey = jarves.getCroppedObjectKey(pId) || this.options.objectKey;
            pId = jarves.getObjectIdFromUrl(pId);
        }

        if (objectKey != this.options.objectKey) {
            if (pCallback) {
                pCallback();
            } else {
                this.loadFirstLevel();
            }
            return;
        }

        new Request.JSON({url: this.getUrl() + pId + '/:parents', noCache: 1, onComplete: function(response) {
            this.load_object_children = [];
            Array.each(response.data, function(item) {
                if (item._object && jarves.normalizeObjectKey(item._object) && jarves.normalizeObjectKey(this.options.objectKey)) {
                    return;
                }
                var id = this.options.objectKey + '/' + jarves.getObjectUrlId(this.options.objectKey, item);
                this.load_object_children.include(id);
            }.bind(this));

            if (pCallback) {
                pCallback(response.data);
            } else {
                this.loadFirstLevel();
            }
        }.bind(this)}).get();

    },

    clean: function() {

        this.destroyContext();

    },

    setRootPosition: function() {
        if (!this.options.rootObject) {
            return;
        }

        var nLeft = this.container.scrollLeft;
        var nTop = 0;

        var panePos = this.paneObjects.getPosition(this.rootContainer).y;
        if (panePos - 20 < 0) {
            nTop = (panePos - 20) * -1;
            var maxTop = this.paneObjects.getSize().y - 20;
            maxTop = 0 > maxTop ? 0 : maxTop;
            if (nTop > maxTop) {
                nTop = maxTop;
            }
        }

        this.paneRoot.morph({
            //'width': nWidth,
            'left': nLeft,
            'top': nTop
        });
    },

    loadFirstLevel: function() {
        if (this.lastFirstLevelRq) {
            this.lastFirstLevelRq.cancel();
        }

        //save height
        this.main.setStyle('height', this.main.getSize().y);

        if (this.options.rootObject && !this.rootLoaded) {
            this.loadRoot();
            return;
        } else if (this.rootA) {
            this.rootA.childrenContainer = this.paneObjects;
        }

        this.lastRootItems = [];
        var scope = null;

        if (this.options.rootObject) {
            scope = this.options.scope;
            if (typeOf(scope) == 'object') {
                scope = jarves.getObjectUrlId(this.options.rootObject, scope);
            }
        }
        this.activeLoadings++;
        this.lastFirstLevelRq = new Request.JSON({url: this.getUrl() + ':branch',
            noCache: 1, onComplete: this.renderFirstLevel.bind(this)
        }).get({scope: scope});
    },

    isEmpty: function() {
        if (this.rootA || this.lastRootItems.length) {
            return false;
        }

        return true;
    },

    loadRoot: function() {
        this.activeLoadings++;
        if (this.lastFirstLevelRq) {
            this.lastFirstLevelRq.cancel();
        }

        if (typeOf(this.options.scope) == 'null' || this.options.scope === false) {
            throw t('Missing option scope in jarves.ObjectTree. Unable to load root ob the object:' + ' ' + this.options.objectKey);
        }

        this.rootLoaded = false;

        var scope = this.options.scope;
        if (typeOf(scope) == 'object') {
            scope = jarves.getObjectUrlId(this.options.rootObject, scope);
        }

        this.lastFirstLevelRq = new Request.JSON({url: this.getUrl() + ':root', noCache: 1,
            onComplete: this.renderRoot.bind(this)
        }).get({
                scope: scope
            });
    },

    renderLabel: function(pContainer, pData, pObjectKey) {
        return pContainer.set('text', jarves.getObjectLabelByItem(pObjectKey, pData, 'tree', {labelTemplate: this.options.labelTemplate}));
    },

    renderRoot: function(pResponse) {
        var item = pResponse.data;

        var id = jarves.getObjectUrlId(this.options.rootObject, item);
        var url = this.options.rootObject + '/' + id;

        this.rootObject = item;

        if (this.paneRoot) {
            this.paneRoot.empty();
        }

        var a = new Element('div', {
            'class': 'jarves-objectTree-item',
            title: 'ID=' + id
        });

        if (this.options.selectable) {
            a.addClass('jarves-objectTree-item-selectable');
        }

        a.id = url;
        a.isRoot = true;
        a.objectKey = this.options.rootObject;

        a.inject(this.paneRoot);

        a.objectTreeObj = this;

        a.span = new Element('span', {
            'class': 'jarves-objectTree-item-title'
        }).inject(a);

        var overwriteDefinition = {
            treeTemplate: this.objectDefinition.treeRootFieldTemplate,
            treeLabel: this.objectDefinition.treeRootFieldLabel
        }

        a.span.set('html', jarves.getObjectLabelByItem(this.options.rootObject, item, 'tree', overwriteDefinition));
        //this.renderLabel(a.span, item, this.options.rootObject, definition);

        this.items[ this.options.rootObject + '/' + id ] = a;

        a.objectEntry = item;

        a.childrenLoaded = true;

        this.rootA = a;
        a.childrenContainer = this.paneObjects;

        this.addRootIcon(item, a);

        a.toggler = new Element('span', {
            'class': 'jarves-objectTree-item-toggler',
            title: t('Open/Close sub-items'),
            html: '&#xe0c3;'
        }).inject(a, 'top');

        this.rootLoaded = true;

        this.loadFirstLevel();

        if (this.options.openFirstLevel) {
            this.openChildren(this.rootA);
        }

        //        if (this.options.selectObject) {
        //            if (!this.firstLoadDone && this.options.rootObject + '/' + id == this.options.selectObject && this.options.selectable == true) {
        //                a.addClass('jarves-objectTree-item-selected');
        //                this.fireEvent('select', [item, a])
        //            }
        //        }

        if (this.selected == url && this.options.selectable) {
            a.addClass('jarves-objectTree-item-selected');
            this.fireEvent('select', [item, a])
        }

        this.activeLoadings--;
    },

    renderFirstLevel: function(pResponse) {
        this.loadingDone = false;

        if (pResponse.error) {
            return false;
        }

        var items = pResponse.data;

        if (!items && this.lastRootItems) {
            items = this.lastRootItems;
        }

        this.lastRootItems = items;

        this.paneObjects.empty();

        this.addRootItems(items, this.paneObjects);

//        if (this.options.withObjectAdd) {
//
////            if (jarves.checkDomainAccess(this.rootA.id, 'addObjects')) {
////
////                new Element('img', {
////                    src: _path + this.options.iconAdd,
////                    title: t('Add object'),
////                    'class': 'jarves-objectTree-add'
////                }).addEvent('click', function(e) {
////                        this.fireEvent('objectAdd', this.rootA.id, this.rootA.objectKey);
////                    }.bind(this)).inject(this.rootA);
////
////            }
//
//        }

        this.firstLevelLoaded = true;
        this.activeLoadings--;
        this.checkDoneState();

        var a = this.rootA;

        if (!a) {
            a = this.paneObjects.getParent();
            a.childrenContainer = this.paneObjects;
        }

        this.fireEvent('childrenLoaded', [this.rootObject, a, this]);

    },

    onMousedown: function(e) {
        if (e.target && e.target.hasClass('jarves-objectTree-item-toggler')) {
            return;
        }
        if (this.options.moveable && e.target) {
            var el = e.target;

            if (!el.hasClass('jarves-objectTree-item')) {
                el = el.getParent('.jarves-objectTree-item');
            }

            if (el) {
                this.activePress = true;
                (function() {
                    if (this.activePress) {
                        this.createDrag(el, e);
                    }
                }).delay(300, this);

            }
        }

        e.preventDefault();
    },

    onTogglerClick: function(e, clicked) {
        this.toggleChildren(clicked.getParent());
    },

    onClick: function(e, clicked) {
        if (e.target && e.target.hasClass('jarves-objectTree-item-toggler')) {
            return;
        }

        if (this.inDragMode) {
            return;
        }
        this.activePress = false;

        var item = clicked.objectEntry;

        if (clicked.rightClick) {
            this.openContext(e, clicked, item);
            return;
        }

        this.deselect();

        if (this.options.selectable) {
            clicked.addClass('jarves-objectTree-item-selected');
        }

        this.lastSelectedItem = clicked;
        this.lastSelectedObject = item;
        this.selected = clicked.id;

        this.fireEvent('selection', [item, clicked, clicked.objectKey]);
        this.fireEvent('select', [item, clicked, clicked.objectKey]);
        this.fireEvent('click', [item, clicked, clicked.objectKey]);
    },

    toElement: function() {
        return this.main;
    },

    reloadParentOfActive: function() {

        if (!this.lastSelectedItem) {
            return;
        }

        if (this.lastSelectedObject.objectKey != this.options.objectKey) {
            //if root object
            this.reload();
            return;
        }

        var parent = this.lastSelectedItem.getParent().getPrevious();
        if (parent && parent.hasClass('jarves-objectTree-item')) {
            this.lastScrollPos = this.container.getScroll();
            this.loadChildren(parent);
        }
    },

    reloadBranch: function(pPk, pTargetObjectKey) {
        var objectKey = this.options.objectKey, id;
        if ('string' !== typeOf(pPk)) {
            id = jarves.getObjectUrlId(this.options.objectKey, pPk);
        } else {
            id = jarves.getCroppedObjectId(pPk);
            objectKey = jarves.getCroppedObjectKey(pPk) || this.options.objectKey;
        }

        if (pTargetObjectKey && pTargetObjectKey != this.options.objectKey) {
            return this.reload();
        } else if (objectKey != this.options.objectKey){
            return this.reload();
        } else {
            var url = objectKey + '/' + id;
            if (this.items[url]) {
                this.reloadChildren(this.items[url]);
            }

//            var targetId = this.options.objectKey + '/' + jarves.getObjectUrlId(this.options.objectKey, pPk);
//            this.startupWithObjectInfo(pPk, function(parents) {
//
//                Array.each(this.load_object_children, function(id) {
//                    if (this.items[id]) {
//                        this.openChildren(this.items[id]);
//                    }
//                }.bind(this));
//
//                if (this.items[targetId]) {
//                    this.reloadChildren(this.items[targetId]);
//                }
//
//            }.bind(this));
        }
    },

    /**
     * Makes sure that the branch of pPk is up2date. If not loaded yet, nothing will happen.
     *
     * @param {Array} pPk
     */
    updateBranch: function(pPk) {
        if ('element' === typeOf(pPk)) {
            pPk = pPk.objectEntry;
        }

        var objectKey = this.options.objectKey, id;
        if ('string' !== typeOf(pPk)) {
            id = jarves.getObjectUrlId(this.options.objectKey, pPk);
        } else {
            id = jarves.getCroppedObjectId(pPk);
            objectKey = jarves.getCroppedObjectKey(pPk) || this.options.objectKey;
        }

        if (this.items[objectKey + '/' + id]) {
            this.reloadBranch(this.items[objectKey + '/' + id].id);
        }
    },

    reloadParentBranch: function(pPk, pTargetObjectKey) {
        if (pTargetObjectKey && pTargetObjectKey != this.options.objectKey) {
            return this.reload();
        } else {
            this.startupWithObjectInfo(pPk, function(parents) {
                if (typeOf(parents) != 'array') {
                    return;
                }

                if (parents.length == 1) {
                    return this.reload();
                } else {

                    var targetId = this.options.objectKey + '/' + jarves.getObjectUrlId(this.options.objectKey, parents[parents.length - 1]);
                    if (this.items[targetId]) {
                        this.reloadChildren(this.items[targetId]);
                    }
                }
            }.bind(this));
        }
    },

    addRootItems: function(pItems, pContainer) {
        if ('array' === typeOf(pItems)) {
            Array.each(pItems, function(item) {
                this.addItem(item, this.rootA);
            }.bind(this));
        }
    },

    addItem: function(pItem, pParent) {
        this.activeLoadings++;
        var id = jarves.getObjectUrlId(this.options.objectKey, pItem);
        var url = this.options.objectKey + '/' + id;

        var a = new Element('div', {
            'class': 'jarves-objectTree-item',
            title: 'ID=' + id
        });

        if (this.options.selectable) {
            a.addClass('jarves-objectTree-item-selectable');
        }

        a.pk = id;
        a.id = url;
        a.parent = pParent;
        a.objectKey = this.options.objectKey;

        var container = pParent;
        if (pParent && pParent.childrenContainer) {
            container = pParent.childrenContainer;
            a.parent = pParent;
        } else {
            container = this.paneObjects;
        }

        a.inject(container);

        a.objectTreeObj = this;

        a.span = new Element('span', {
            'class': 'jarves-objectTree-item-title'
        }).inject(a);
        a.objectEntry = pItem;

        this.renderLabel(a.span, pItem, this.options.objectKey);

        this.items[url] = a;

        if (a.parent) {
            var paddingLeft = 20;
            if (a.parent.getStyle('padding-left').toInt()) {
                paddingLeft += a.parent.getStyle('padding-left').toInt();
            }

            a.setStyle('padding-left', paddingLeft);
        }

        this.addItemIcon(pItem, a);

        /* toggler */
        a.toggler = new Element('span', {
            'class': 'jarves-objectTree-item-toggler',
            title: t('Open/Close subitems'),
            html: '&#xe0c3;'
        }).inject(a, 'top');

        if (pItem._childrenCount == 0) {
            a.toggler.setStyle('visibility', 'hidden');
        }

        a.childrenContainer = new Element('div', {
            'class': 'jarves-objectTree-item-children'
        }).inject(container);

        a.childrenLoaded = (pItem._children) ? true : false;

        if (this.opens[a.pk]) {
            this.openChildren(a);
        }

        if (this.load_object_children !== false) {
            if (this.load_object_children.contains(id)) {
                this.openChildren(a);
            }
        }

        if (pItem._children) {
            Array.each(pItem._children, function(item) {
                this.addItem(item, a);
            }.bind(this));
        }

        //        if (!this.firstLoadDone && !this.selected && this.options.selectObject) {
        //            var selectUrl = jarves.getObjectKey(this.options.selectObject) || this.options.objectKey;
        //            selectUrl += '/' + jarves.getCroppedObjectId(this.options.selectObject);
        //
        //            if (url == selectUrl && this.options.selectable == true) {
        //                a.addClass('jarves-objectTree-item-selected');
        //                this.fireEvent('select', [pItem, a])
        //            }
        //        } else
        //
        if (this.selected == url && this.options.selectable) {
            a.addClass('jarves-objectTree-item-selected');
            this.fireEvent('select', [pItem, a])
        }

        this.activeLoadings--;
        this.checkDoneState();

        return a;
    },

    addRootIcon: function(pItem, pA) {

        var icon = this.objectDefinition.treeRootObjectIconPath;

        if (!this.objectDefinition.treeRootObjectFixedIcon) {
            icon = this.options.iconMap[pItem[this.objectDefinition.treeRootObjectIcon]];
        }

        if (icon) {
            icon = jarves.mediaPath(icon);

            pA.icon = new Element('span', {
                'class': 'jarves-objectTree-item-masks'
            }).inject(pA, 'top');

            if (icon.substr(0, 1) != '#') {
                new Element('img', {
                    'class': 'jarves-objectTree-item-type',
                    src: icon
                }).inject(pA.masks);
            } else {
                pA.icon.addClass(icon.substr(1));
            }
        }

    },

    addItemIcon: function(pItem, pA) {

        var icon = this.options.icon;

        if (this.options.iconMap && this.objectDefinition.treeIcon) {
            icon = this.options.iconMap[pItem[this.objectDefinition.treeIcon]];
        }

        if (!icon && this.objectDefinition.treeDefaultIcon) {
            icon = this.objectDefinition.treeDefaultIcon;
        }

        if (!icon) {
            return;
        }

        icon = jarves.mediaPath(icon);

        pA.icon = new Element('span', {
            'class': 'jarves-objectTree-item-masks'
        }).inject(pA, 'top');

        if (icon.substr(0, 1) != '#') {
            new Element('img', {
                'class': 'jarves-objectTree-item-type',
                src: icon
            }).inject(pA.icon);
        } else {
            pA.icon.addClass(icon.substr(1));
        }

    },

    checkDoneState: function() {
        if (this.activeLoadings == 0) {
            if (this.firstLoadDone == false) {
                this.firstLoadDone = true;

                this.fireEvent('ready', this);
            }

            this.main.setStyle('height');

            this.setRootPosition();
        }
    },

    saveOpens: function() {
        var opens = '';
        Object.each(this.opens, function(bool, key) {
            if (bool == true) {
                opens += key + '.';
            }
        });
        Cookie.write('jarvesObjectTree_' + this.options.objectKey, opens);
    },

    toggleChildren: function(pA) {
        if (!pA.childrenContainer.hasClass('jarves-objectTree-item-children-show')) {
            this.openChildren(pA);
        } else {
            this.closeChildren(pA);
        }
    },

    closeChildren: function(pA) {
        var item = pA.objectEntry;

        pA.childrenContainer.removeClass('jarves-objectTree-item-children-show');
        pA.toggler.set('html', '&#xe0c3;');
        this.opens[ pA.pk ] = false;
        this.setRootPosition();

        this.saveOpens();
    },

    openChildren: function(pA) {
        if (!pA.toggler) {
            return;
        }

        pA.toggler.set('html', '&#xe0c4;');
        if (true === pA.childrenLoaded) {
            pA.childrenContainer.addClass('jarves-objectTree-item-children-show');
            this.opens[ pA.pk ] = true;
            this.saveOpens();
        } else {
            this.loadChildren(pA, true);
        }
        this.setRootPosition();

    },

    reloadChildren: function(pA) {
        if (this.rootA == pA) {
            this.loadFirstLevel();
        } else {
            this.loadChildren(pA, false);
        }
    },

    removeChildren: function(pA) {
        if (!pA.childrenContainer) {
            return;
        }

        pA.childrenContainer.getElements('jarves-objectTree-item').each(function(a) {
            delete this.items[a.id];
        }.bind(this));

        pA.childrenContainer.empty();
    },

    loadChildren: function(pA, pAndOpen) {
        this.activeLoadings++;
        var item = pA.objectEntry;

        var loader = new Element('img', {
            src: _path + 'bundles/jarves/admin/images/loading.gif',
            style: 'position: relative; top: 3px;'
        }).inject(pA.span);

//        console.log('loadChildren', this.getUrl(), pA.id, '=>', jarves.getCroppedObjectId(pA.id), '/:branch');
        new Request.JSON({url: this.getUrl() + jarves.getCroppedObjectId(pA.id) + '/:branch',
            noCache: 1, onComplete: function(pResponse) {

                //save height
                if (pA.childrenContainer) {
                    pA.childrenContainer.setStyle('height', pA.childrenContainer.getSize().y);
                }

                this.removeChildren(pA);
                loader.destroy();

                if (pAndOpen) {
                    pA.toggler.set('html', '&#xe0c4;');
                    pA.childrenContainer.addClass('jarves-objectTree-item-children-show');
                    this.opens[ pA.pk ] = true;
                    this.saveOpens();
                }

                pA.childrenLoaded = true;

                pA.toggler.setStyle('visibility');

                if ('array' !== typeOf(pResponse.data) || pResponse.data.length == 0) {
                    pA.toggler.setStyle('visibility', 'hidden');
                    return;
                }

                Array.each(pResponse.data, function(childitem) {
                    this.addItem(childitem, pA);
                }.bind(this));

                this.fireEvent('childrenLoaded', [item, pA, this]);

                this.activeLoadings--;
                this.checkDoneState();

                pA.childrenContainer.setStyle('height');

            }.bind(this)}).get();

    },

    deselect: function() {
        this.container.getElements('.jarves-objectTree-item-selected').removeClass('jarves-objectTree-item-selected');

        this.lastSelectedItem = false;
        this.lastSelectedObject = false;
        this.selected = null;
    },

    createDrag: function(pA, pEvent) {

        this.currentObjectToDrag = pA;

        var canMoveObject = true;
        var object = pA.objectEntry;

        /*
         if (object.domain) {
         if (!jarves.checkObjectAccess(object.id, 'moveObjects', 'd')) {
         canMoveObject = false;
         }
         } else {
         if (!jarves.checkObjectAccess(object.id, 'moveObjects')) {
         canMoveObject = false;
         }
         }*/

        var kwin = pA.getParent('.kwindow-border');

        if (this.lastClone) {
            this.lastClone.destroy();
        }

        this.lastClone = new Element('div', {
            'class': 'jarves-objectTree-drag-box'
        }).inject(kwin);

        new Element('span', {
            text: pA.get('text')
        }).inject(this.lastClone);

        if (pA.icon) {
            pA.icon.clone().inject(this.lastClone, 'top');
        }

        var drag = this.lastClone.makeDraggable({
            snap: 3,
            onDrag: function(pDrag, pEvent) {
                if (!pEvent.target) {
                    return;
                }
                var element = pEvent.target;

                if (!element.hasClass('jarves-objectTree-item')) {
                    element = element.getParent('.jarves-objectTree-item');
                }

                if (element) {

                    var pos = pEvent.target.getPosition(document.body);
                    var size = pEvent.target.getSize();
                    var mrposy = pEvent.client.y - pos.y;

                    if (!this.dndOnlyInside && mrposy < size.y / 3) {
                        this.createDropElement(element, 'before');
                    } else if (!this.dndOnlyInside && mrposy > ((size.y / 3) * 2)) {
                        this.createDropElement(element, 'after');
                    } else {
                        //middle
                        this.createDropElement(element, 'inside');
                    }

                }
            }.bind(this),
            onDrop: this.cancelDragNDrop.bind(this),
            onCancel: function() {
                this.cancelDragNDrop(true);
            }.bind(this)
        });

        this.inDragMode = true;
        this.inDragModeA = pA;

        var pos = kwin.getPosition(document.body);

        this.lastClone.setStyles({
            'left': pEvent.client.x + 5 - pos.x,
            'top': pEvent.client.y + 5 - pos.y
        });

        document.addEvent('mouseup', this.cancelDragNDrop.bind(this, true));

        drag.start(pEvent);
    },

    createDropElement: function(pTarget, pPos) {

        if (this.loadChildrenDelay) {
            clearTimeout(this.loadChildrenDelay);
        }

        if (this.dropElement) {
            this.dropElement.destroy();
            delete this.dropElement;
        }

        if (this.currentObjectToDrag == pTarget) {
            return;
        }

        this.dragNDropElement = pTarget;
        this.dragNDropPos = pPos;

        if (this.dropLastItem) {
            this.dropLastItem.removeClass('jarves-objectTree-item-dragOver');
            this.dropLastItem.setStyle('padding-bottom', 1);
            this.dropLastItem.setStyle('padding-top', 1);
        }

        var item = pTarget.objectEntry;

        pTarget.setStyle('padding-bottom', 1);
        pTarget.setStyle('padding-top', 1);

        if (pTarget.objectKey == this.options.objectKey) {
            if (pPos == 'after' || pPos == 'before') {
                this.dropElement = new Element('div', {
                    'class': 'jarves-objectTree-dropElement',
                    styles: {
                        'margin-left': pTarget.getStyle('padding-left').toInt() + 16
                    }
                });
            } else {
                if (this.lastDropElement == pTarget) {
                    return;
                }
            }
        }

        var canMoveInto = true;
        /*
         if (item.domain) {
         if (!jarves.checkObjectAccess(item.id, 'addObjects', 'd')) {
         canMoveInto = false;
         }
         } else {
         if (!jarves.checkObjectAccess(item.id, 'addObjects')) {
         canMoveInto = false;
         }
         }*/

        var canMoveAround = true;
        if (pTarget.parent) {
            var parentObject = pTarget.parent.objectEntry;
            /*
             if (parentObject.domain) {
             if (!jarves.checkObjectAccess(parentObject.id, 'addObjects', 'd')) {
             canMoveAround = false;
             }
             } else {
             if (!jarves.checkObjectAccess(parentObject.id, 'addObjects')) {
             canMoveAround = false;
             }
             }*/
        }

        if (pTarget.objectKey == this.options.objectKey && pPos == 'after') {
            if (canMoveAround) {
                this.dropElement.inject(pTarget.getNext(), 'after');
                pTarget.setStyle('padding-bottom', 0);
            }

        } else if (pTarget.objectKey == this.options.objectKey && pPos == 'before') {
            if (canMoveAround) {
                this.dropElement.inject(pTarget, 'before');
                pTarget.setStyle('padding-top', 0);
            }

        } else if (pPos == 'inside') {
            if (canMoveInto) {
                pTarget.addClass('jarves-objectTree-item-dragOver');
            }
            this.loadChildrenDelay = function() {
                this.openChildren(pTarget);
            }.delay(1000, this);
        }

        this.dropLastItem = pTarget;
    },

    cancelDragNDrop: function(pWithoutMoving) {

        if (this.lastClone) {
            this.lastClone.destroy();
            delete this.lastClone;
        }
        if (this.dropElement) {
            this.dropElement.destroy();
            delete this.dropElement;
        }
        if (this.dropLastItem) {
            this.dropLastItem.removeClass('jarves-objectTree-item-dragOver');
            this.dropLastItem.setStyle('padding-bottom', 1);
            this.dropLastItem.setStyle('padding-top', 1);
            delete this.dropLastItem;
        }
        this.inDragMode = false;
        delete this.inDragModeA;

        if (pWithoutMoving != true) {

            var pos = {
                'before': 'prev',
                'after': 'next',
                'inside': 'into'
            };

            var target = this.dragNDropElement;
            var source = this.currentObjectToDrag;

            if (target && source) {
                var code = pos[this.dragNDropPos];

                if (this.rootA == target) {
                    code = 'into';
                }

                this.moveObject(source.id, target.id, target.objectKey, code);
            }
        }
        document.removeEvent('mouseup', this.cancelDragNDrop.bind(this));
    },

    reloadParent: function(pA) {
        if (pA.parent) {
            pA.objectTreeObj.reloadChildren(pA.parent);
        } else {
            pA.objectTreeObj.reload();
        }
    },

    moveObject: function(pSourceId, pTargetId, pTargetObjectKey, pPosition, overwrite) {
        var urlId = jarves.getCroppedObjectId(pSourceId);
        var targetId = jarves.getCroppedObjectId(pTargetId);

        new Request.JSON({url: this.getUrl() + urlId + '/:move', onComplete: function(response) {
            //target item this.dragNDropElement
            if (response.data && response.data.targetExists) {
                this.getWin().confirm(t('Target already exists. Overwrite?'), function(answer) {
                    if (answer) {
                        this.moveObject(pSourceId, pTargetId, pTargetObjectKey, pPosition, true);
                    }
                }.bind(this));
                return;
            }

            if (this.dragNDropElement.parent) {
                this.dragNDropElement.objectTreeObj.reloadChildren(this.dragNDropElement.parent);
            } else {
                this.dragNDropElement.objectTreeObj.reload();
            }

            //origin item this.currentObjectToDrag
            if (this.currentObjectToDrag.parent && (!this.dragNDropElement.parent || this.dragNDropElement.parent != this.currentObjectToDrag.parent)) {
                this.currentObjectToDrag.objectTreeObj.reloadChildren(this.currentObjectToDrag.parent);
            } else if (!this.dragNDropElement.parent || this.dragNDropElement.objectTreeObj != this.currentObjectToDrag.objectTreeObj) {
                this.currentObjectToDrag.objectTreeObj.reload();
            }

            this.fireEvent('move', [pSourceId, pTargetId]);

        }.bind(this)}).post({
                target: targetId,
                position: pPosition,
                targetObjectKey: pTargetObjectKey,
                overwrite: overwrite
            });
    },

    reload: function() {
        this.loadFirstLevel();
    },

    reloadSelected: function() {
        var item = this.getSelectedElement();
        if (item) {
            this.reloadChildren(item);
        }
    },

    isReady: function() {
        return this.firstLoadDone;
    },

    hasChildren: function(pObject) {
        if (this._objectsParent.get(pObject.id)) {
            return true;
        }
        return false;
    },

    hasSelected: function() {
        var selected = this.container.getElement('.jarves-objectTree-item-selected');
        return selected != null;
    },

    getSelected: function() {
        var selected = this.container.getElement('.jarves-objectTree-item-selected');
        return selected ? selected.objectEntry : false;
    },

    getSelectedElement: function() {
        var selected = this.container.getElement('.jarves-objectTree-item-selected');
        return selected ? selected : false;
    },

    getItem: function(pId) {
        var id = 'string' === typeOf(pId) ? pId : this.options.objectKey + '/' + jarves.getObjectUrlId(this.options.objectKey, pId);
        return this.items[id];
    },

    getValue: function() {
        return this.getSelected();
    },

    setValue: function(pValue) {
        this.select(pValue);
    },

    /**
     *
     * @param {Object|String} url
     */
    select: function(url) {
        var id, objectKey = this.options.objectKey;

        if ('object' === typeOf(url)) {
            id = this.options.objectKey + '/' + jarves.getObjectUrlId(this.options.objectKey, url);
        } else {
            id = url;
        }

//        if ('string' === typeOf(pPk) && this.options.rootObject) {
//            //it could be the root item/different objectKey
//            objectKey = jarves.getCroppedObjectKey(pPk) || this.options.objectKey;
//            id = objectKey + '/' + jarves.getCroppedObjectId(pPk);
////            console.log('converted from object url: ', pPk, objectKey, id);
//        } else {
//            if ('object' === typeOf(pPk)) {
//                id = jarves.getObjectUrlId(this.options.objectKey, pPk);
//            } else {
//                id = pPk;
//            }
//            id = this.options.objectKey + '/' + id;
//        }

//        console.log('select from', pPk, ' to ', id);

        this.deselect();
        this.selected = id;

        if (this.items[id]) {
            if (this.items[id].hasClass('jarves-objectTree-item-selected')) {
                return;
            }

            //has been loaded already
            this.items[id].addClass('jarves-objectTree-item-selected');

            this.lastSelectedItem = this.items[id];
            this.lastSelectedObject = this.items[id].objectEntry;

            //open parents too
            var parent = this.items[id];
            while (true) {
                if (parent.parent) {
                    parent = parent.parent;
                    this.openChildren(parent);
                } else {
                    break;
                }
            }

            return;
        }

//        console.log(this.options.objectKey, objectKey, id, pPk);
        if (this.options.objectKey != objectKey) {
            //root item selected
            this.rootA.addClass('jarves-objectTree-item-selected');

            this.lastSelectedItem = this.rootA;
            this.lastSelectedObject = this.rootA.objectEntry;
        } else {
            this.startupWithObjectInfo(id, function() {
                Array.each(this.load_object_children, function(cid) {
                    if (this.items[cid]) {
                        this.openChildren(this.items[cid]);
                    }
                }.bind(this));
            }.bind(this));
        }
    },

    destroyContext: function() {
        if (this.oldContext) {
            this.lastContextA.removeClass('jarves-objectTree-item-hover');
            this.oldContext.destroy();
            delete this.oldContext;
        }
    },

    openContext: function(pEvent, pA, pObject) {

        if (this.options.withContext != true) {
            return;
        }

        if (!pEvent.rightClick) {
            return;
        }

        window.fireEvent('mouseup');
        pEvent.stopPropagation();

        pA.addClass('jarves-objectTree-item-hover');
        this.lastContextA = pA;

        this.oldContext = new Element('div', {
            'class': 'jarves-objectTree-context'
        }).inject(document.body);

        this.createContextItems(pA);
        this.doContextPosition(pEvent);
    },

    createContextItems: function(pA) {

        var pObject = pA.objectEntry;

        var objectCopy = {
            objectKey: this.options.objectKey,
            object: pObject
        };

        this.cmCopyBtn = new Element('a', {
            html: t('Copy')
        }).addEvent('click', function() {
                jarves.setClipboard(t('Object %s copied').replace('%s', this.objectDefinition.label), 'objectCopy', objectCopy);
            }.bind(this)).inject(this.oldContext);

        this.cmCopyWSBtn = new Element('a', {
            html: t('Copy with sub-elements')
        }).addEvent('click', function() {
                jarves.setClipboard(t('Object %s with sub elements copied').replace('%s', this.objectDefinition.label), 'objectCopyWithSubElements', objectCopy);
            }.bind(this)).inject(this.oldContext);

        this.cmDeleteDelimiter = new Element('a', {
            'class': 'delimiter'
        }).inject(this.oldContext);

        this.cmDeleteBtn = new Element('a', {
            html: t('Delete')
        }).addEvent('click', function() {

            }.bind(this)).inject(this.oldContext);

        var clipboard = jarves.getClipboard();
        if (!(clipboard.type == 'objectCopyWithSubpages' || clipboard.type == 'objectCopy')) {
            return;
        }

        var canPasteInto = true;
        var canPasteAround = true;

        /* todo

         if (pPage.domain) {
         if (!jarves.checkPageAccess(pPage.id, 'addPages', 'd')) {
         canPasteInto = false;
         }
         } else {
         if (!jarves.checkPageAccess(pPage.id, 'addPages')) {
         canPasteInto = false;
         }
         }

         if (pA.parent) {
         var parentPage = pA.parent.objectEntry;
         if (parentPage.domain) {
         if (!jarves.checkPageAccess(parentPage.id, 'addPages', 'd')) {
         canPasteAround = false;
         }
         } else {
         if (!jarves.checkPageAccess(parentPage.id, 'addPages')) {
         canPasteAround = false;
         }
         }
         }*/

        if (canPasteAround || canPasteInto) {

            this.cmPasteBtn = new Element('a', {
                'class': 'noaction',
                html: t('Paste')
            }).inject(this.oldContext);

            if (canPasteAround && !pPage.domain) {
                this.cmPasteBeforeBtn = new Element('a', {
                    'class': 'indented',
                    html: t('Before')
                }).addEvent('click', function() {
                        this.paste('up', pPage);
                    }.bind(this)).inject(this.oldContext);
            }

            if (canPasteInto) {
                this.cmPasteIntoBtn = new Element('a', {
                    'class': 'indented',
                    html: t('Into')
                }).addEvent('click', function() {
                        this.paste('into', pPage);
                    }.bind(this)).inject(this.oldContext);
            }
            if (canPasteAround && !pPage.domain) {
                this.cmPasteAfterBtn = new Element('a', {
                    'class': 'indented',
                    html: t('After')
                }).addEvent('click', function() {
                        this.paste('down', pPage);
                    }.bind(this)).inject(this.oldContext);
            }
        }

    },

    doContextPosition: function(pEvent) {

        var wsize = window.getSize();
        var csize = this.oldContext.getSize();

        var left = pEvent.page.x - (this.container.getPosition(document.body).x);
        var mtop = pEvent.page.y - (this.container.getPosition(document.body).y);

        var left = pEvent.page.x;
        var mtop = pEvent.page.y;
        if (mtop < 0) {
            mtop = 1;
        }

        this.oldContext.setStyles({
            left: left,
            'top': mtop
        });

        if (mtop + csize.y > wsize.y) {
            mtop = mtop - csize.y;
            this.oldContext.setStyle('top', mtop + 1);
        }
    }

});
