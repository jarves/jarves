jarves.Controller.WindowController = new Class({

    Statics: {
        $inject: ['$scope', '$element', '$attrs', 'windowService', 'jarves']
    },
    JarvesController: 'jarvesWindowController',

    active: false,

    view: 'bundles/jarves/admin/js/views/window.content.default.html',

    title: '',
    titlePath: [],

    sidebar: null,
    content: null,
    frame: null,

    initialize: function($scope, $element, $attrs, windowService, jarvesService) {
        this.scope = $scope;
        this.scope.forms = {};
        this.element = $element;
        this.attributes = $attrs;
        this.windowService = windowService;
        this.jarves = jarvesService;
        this.entryPoint = this.scope.windowInfo.entryPoint;
        this.id = this.scope.windowInfo.id;
        this.parentId = this.scope.parentWindowId;
        this.inline = !!this.scope.isInline;
        this.parameters = this.scope.parameters;
        this.originParameters = JSON.decode(JSON.encode(this.scope.parameters));

        if (this.entryPoint.templateUrl) {
            this.view = jarves.getPublicPath(this.entryPoint.templateUrl);
        } else {
            if ('custom' !== this.entryPoint.type && this.entryPoint.type) {
                this.view = 'bundles/jarves/admin/js/views/window.content.' + this.entryPoint.type.toLowerCase() + '.html';
            }
        }

        console.log('new JarvesWindowController', this.entryPoint, this.view);

        this.scope.windowInfo.window = this;
        this.scope.window = this;

        this.setTitle(this.entryPoint.label);

        if (this.parentId) {
            if (typeOf(this.parentId) == 'number' && windowService.getWindow(this.parentId)) {
                windowService.getWindow(this.parentId).setChildren(this);
            }
        }

        this.loadContent();
    },

    setActive: function(active) {
        this.active = active;
    },

    /**
     * @param {jqLite} element
     */
    setSidebar: function(element) {
        this.sidebar = element;
        if (this.getFrame()) {
            this.getFrame().attr('with-sidebar', true);
        }
    },



    /**
     *
     * @returns {jqLite|null}
     */
    getSidebar: function() {
        return this.sidebar;
    },

    /**
     * @param {jqLite} element
     */
    setContent: function(element) {
        this.content = element;
    },

    /**
     *
     * @returns {jqLite|null}
     */
    getContent: function() {
        return this.content;
    },


    /**
     * @param {jqLite} element
     */
    setFrame: function(element) {
        this.frame = element;
    },

    /**
     *
     * @returns {jqLite|null}
     */
    getFrame: function() {
        return this.frame;
    },

    /**
     * @param {String} title
     */
    setTitle: function(title) {
        this.title = title;
        this.generateTitlePath();
    },

    getOriginParameters: function() {
        return this.originParameters;
    },

    /**
     *
     * @returns {String|undefined}
     */
    getBundleName: function() {
        if (this.getEntryPoint().indexOf('/') > 0) {
            return this.getEntryPoint().substr(0, this.getEntryPoint().indexOf('/'));
        }
    },

    setChildren: function(window) {
        this.childrenWindow = window;
    },

    /**
     * @returns {String}
     */
    getEntryPoint: function () {
        return this.entryPoint.fullPath;
    },

    /**
     * @returns {Object}
     */
    getEntryPointDefinition: function () {
        return this.entryPoint;
    },

    /**
     * Sets scope.titlePath
     */
    generateTitlePath: function() {
        var titlePath = [];
        var title = this.jarves.getConfig( this.getBundleName() )['label'] || this.jarves.getConfig( this.getBundleName() )['name'];

        titlePath.push(title);

        var path = Array.clone(this.getEntryPointDefinition()._path);
        path.pop();
        Array.each(path, function (label) {
            titlePath.push(label);
        }.bind(this));

        titlePath.push(this.scope.title);
        this.titlePath = titlePath;
    },

    /**
     *
     * @returns {Boolean}
     */
    isInline: function() {
        return this.inline;
    },

    /**
     * angular link method
     */
    link: function() {
        this.element.addClass('jarves-admin jarves-Window-border');
    },

    /**
     * Returns the internal window id.
     *
     * @returns {Number}
     */
    getId: function() {
        return this.id;
    },

    close: function() {
        this.windowService.unregister(this.getId());
    },

    loadContent: function () {
        this.windowService.toFront(this);

        if (!this.entryPoint.multi) {
            var win = this.windowService.checkOpen(this.getEntryPoint(), this.id);
            if (win) {
                if (win.softOpen) {
                    win.softOpen(this.params);
                }
                win.toFront();
                this.close(true);
                return;
            }
        }

//        if (this.entryPointDefinition.type == 'iframe') {
//            this.content.empty();
//            this.iframe = new IFrame('iframe_kwindow_' + this.id, {
//                'class': 'jarves-Window-iframe',
//                frameborder: 0
//            }).addEvent('load', function () {
//                    this.iframe.contentWindow.win = this;
//                    this.iframe.contentWindow.jarves = jarves;
//                    this.iframe.contentWindow.wm = jarves.wm;
//                    this.iframe.contentWindow.fireEvent('kload');
//                }.bind(this)).inject(this.content);
//            this.iframe.set('src', _path + this.entryPointDefinition.src);
//        } else if (this.entryPointDefinition.type == 'custom') {
//            this.renderCustom();
//        } else if (this.entryPointDefinition.type == 'combine') {
//            this.renderCombine();
//        } else if (this.entryPointDefinition.type == 'list') {
//            this.renderList();
//        } else if (this.entryPointDefinition.type == 'add') {
//            this.renderAdd();
//        } else if (this.entryPointDefinition.type == 'edit') {
//            this.renderEdit();
//        }

    }

});