/*
 * This file is part of Jarves.
 *
 * (c) Marc J. Schmidt <marc@marcjschmidt.de>
 *
 *     J.A.R.V.E.S - Just A Rather Very Easy [content management] System.
 *
 *     http://jarves.io
 *
 * To get the full copyright and license information, please view the
 * LICENSE file, that was distributed with this source code.
 */

jarves.FieldTypes.Tree = new Class({
    Extends: jarves.FieldAbstract,
    Binds: ['selected'],

    Statics: {
        asModel: true
    },

    options: {
        /**
         * Use a object key or a entry point.
         *
         * @var {String}
         */
        object: '',

        /**
         * Use a object key or a entry point.
         *
         * @var {String}
         */
        entryPoint: '',

        /**
         * The pk value of the scope.
         * If this is null, we display a jarves.Select chooser of all scopes (object entries from RootAsObject)
         *
         * @var {Mixed}
         */
        scope: null,

        /**
         * if the object has a scope (RootAsObject), then we display the root's object as jarves.Select (true) or
         * we display all roots at once (false)
         *
         * @var boolean
         */
        scopeChooser: null,

        /**
         * if the object behind the scope (RootAsObject) is multiLanguage, we can filter by it.
         *
         * @var {Boolean}
         */
        scopeLanguage: null,

        /**
         * if the object behind the scope (RootAsObject) is domainDepended, we can filter by it.
         *
         * @var {Boolean}
         */
        scopeDomain: null,

        /**
         * TODO, can be useful
         * @var [Boolean}
         */
        scopeCondition: false,

        /**
         * Enables the drag'n'drop moving.
         * Default is the `treeMoveable` property at the object.
         *
         * @var {Boolean}
         */
        moveable: null,

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
         * @var {Mixed}
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

        labelTemplate: false,
        objectFields: ''
    },

    trees: [],

    definition: {},

    createLayout: function () {

        if (!this.options.object) {
            throw '`object` option in jarves.Field `tree` required.';
        }

        this.definition = jarves.getObjectDefinition(this.options.object);

        if (!this.definition) {
            throw 'Object not found ' + this.options.object;
        }
        if (!this.definition.nested) {
            throw 'Object is not a nested set ' + this.options.object;
        }

        if (!this.options.labelTemplate) {
            this.options.labelTemplate = this.definition.labelTemplate;
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

        if (null === this.options.scopeChooser) {
            this.options.scopeChooser = this.definition.nestedRootAsObject ? true : false;
        }

        if (null !== this.options.selectObject) {
            this.selectObject = this.options.selectObject;
        }

        if (null === this.options.moveable) {
            this.options.moveable =
                typeOf(this.definition.treeMoveable) !== 'null' ? this.definition.treeMoveable : true;
        }

        if (!this.options.scope && this.definition.nestedRootAsObject) {
            if (this.options.scopeChooser) {
                var options = {
                    object: this.options.rootObject,
                    objectLanguage: this.options.scopeLanguage
                };

                this.scopeField = new jarves.Select(this.fieldInstance.fieldPanel, options);

                this.scopeField.addEvent('change', function () {
                    this.loadTree(this.scopeField.getValue());
                }.bind(this));
            } else {
                //load all scope entries
                new Request.JSON({url: this.getUrl() + ':roots',
                    onComplete: function (pResponse) {
                        this.treesContainer.empty();
                        this.trees = [];

                        if (pResponse.data) {
                            Array.each(pResponse.data, function (item) {
                                this.addTree(item);
                            }.bind(this));
                        } else {
                            this.addTree();
                        }

                    }.bind(this)}).get({
                        domain: this.options.scopeDomain,
                        lang: this.options.scopeLanguage
                    });
            }

            this.treesContainer = new Element('div').inject(this.fieldInstance.fieldPanel);
        } else {
            this.treesContainer = this.fieldInstance.fieldPanel;
            this.loadTree(this.options.scope);
        }
    },

    getUrl: function () {
        return _pathAdmin + (this.options.entryPoint ? this.options.entryPoint : 'object/' + jarves.normalizeObjectKey(this.options.object) ) + '/';
    },

    loadTree: function (scope) {
        this.treesContainer.empty();

        this.trees = [];

        this.addTree(scope);
    },

    addTree: function (scope) {
        var clazz = jarves.ObjectTree;

        if (this.options.treeInterface && this.options.treeInterface != 'default') {
            if (!this.options.treeInterfaceClass) {
                throw 'TreeInterface class in "treeInterfaceClass" is not defined.'
            } else {
                if (!(clazz = jarves.getClass(this.options.treeInterfaceClass))) {
                    throw 'Class does not exist ' + this.options.treeInterfaceClass;
                }
            }
        }

        var options = Object.clone(this.options);
        options.scope = scope;
        options.objectKey = options.object;
        if (this.selectItem) {
            options.selectObject = this.selectItem;
        }

        var tree = new clazz(this.treesContainer, options);
        tree.addEvent('select', this.selected);
        tree.addEvent('select', this.fireChange.bind(this));

        var proxyEvents = ['ready', 'childrenLoaded', 'select', 'move'];
        proxyEvents.each(function (event) {
            tree.addEvent(event, function () {
                var args = Array.from(arguments);
                args.push(tree);
                this.fieldInstance.fireEvent(event, args);
            }.bind(this));

        }.bind(this));

        this.trees.push(tree);
        return tree;
    },

    select: function(pk) {
        if (this.trees.length == 0) {
            this.selectItem = pk;
        } else {
            this.trees.each(function(tree){
                tree.select(pk);
            }.bind(this));
        }
    },

    reloadSelected: function(){
        if (0 < this.trees.length) {
            this.trees.each(function(tree){
                tree.reloadSelected();
            }.bind(this));
        }
    },

    reload: function(){
        if (0 < this.trees.length) {
            this.trees.each(function(tree){
                tree.reload();
            }.bind(this));
        }
    },

    getSelectedTree: function () {
        var selected = null;
        Array.each(this.trees, function (tree) {
            if (selected) {
                return;
            }
            if (tree.hasSelected()) {
                selected = tree;
            }
        });

        return selected;
    },

    deselect: function () {
        Array.each(this.trees, function (tree) {
            tree.deselect();
        });
    },

    reloadParent: function (parent) {
        Array.each(this.trees, function (tree) {
            tree.reloadParent(parent);
        });
    },

    updateBranch: function (pk) {
        Array.each(this.trees, function (tree) {
            tree.updateBranch(pk);
        });
    },

    reloadParentBranch: function (pPk, pObjectKey) {
        Array.each(this.trees, function (tree) {
            tree.reloadParentBranch(pPk, pObjectKey);
        });
    },

    reloadBranch: function (pPk, pObjectKey) {
        Array.each(this.trees, function (tree) {
            tree.reloadBranch(pPk, pObjectKey);
        });
    },

    getTrees: function () {
        return this.trees;
    },

    getTree: function () {
        return this.trees[0];
    },

    selected: function (pItem, pDom) {
        this.fireEvent('select', [pItem, pDom]);
    },

    setValue: function (pValue) {
        Array.each(this.trees, function (tree) {
            tree.setValue(pValue);
        });
    },

    getValue: function () {
        var value = null;
        Array.each(this.trees, function (tree) {
            if (value !== null) {
                return;
            }
            if (tree.hasSelected()) {
                value = tree.getValue();
            }
        });
        return value;
    }
});