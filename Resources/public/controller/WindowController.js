import utils from '../utils'

export default class WindowController {
    constructor($scope, $element, $attrs, windowService, jarves) {
        this.scope = $scope;
        this.scope.forms = {};
        this.element = $element;
        this.attributes = $attrs;
        this.windowService = windowService;
        this.jarves = jarves;
        this.entryPoint = this.scope.windowInfo.entryPoint;
        this.id = this.scope.windowInfo.id;
        this.parentId = this.scope.parentWindowId;
        this.inline = !!this.scope.isInline;
        this.parameters = this.scope.parameters;
        this.originParameters = JSON.decode(JSON.encode(this.scope.parameters));

        this.active = false;
        this.title = '';
        this.titlePath = [];
        this.sidebar = null;
        this.content = null;
        this.frame = null;
        this.view = 'bundles/jarves/admin/js/views/window.content.default.html';

        if (this.entryPoint.templateUrl) {
            this.view = utils.getPublicPath(this.entryPoint.templateUrl);
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
    }

    setActive(active) {
        this.active = active;
    }

    /**
     * @param {jqLite} element
     */
    setSidebar(element) {
        this.sidebar = element;
        if (this.getFrame()) {
            this.getFrame().attr('with-sidebar', true);
        }
    }



    /**
     *
     * @returns {jqLite|null}
     */
    getSidebar() {
        return this.sidebar;
    }

    /**
     * @param {jqLite} element
     */
    setContent(element) {
        this.content = element;
    }

    /**
     *
     * @returns {jqLite|null}
     */
    getContent() {
        return this.content;
    }


    /**
     * @param {jqLite} element
     */
    setFrame(element) {
        this.frame = element;
    }

    /**
     *
     * @returns {jqLite|null}
     */
    getFrame() {
        return this.frame;
    }

    /**
     * @param {String} title
     */
    setTitle(title) {
        this.title = title;
        this.generateTitlePath();
    }

    getOriginParameters() {
        return this.originParameters;
    }

    /**
     *
     * @returns {String|undefined}
     */
    getBundleName() {
        if (this.getEntryPoint().indexOf('/') > 0) {
            return this.getEntryPoint().substr(0, this.getEntryPoint().indexOf('/'));
        }
    }

    setChildren(window) {
        this.childrenWindow = window;
    }

    /**
     * @returns {String}
     */
    getEntryPoint () {
        return this.entryPoint.fullPath;
    }

    /**
     * @returns {Object}
     */
    getEntryPointDefinition () {
        return this.entryPoint;
    }

    /**
     * Sets scope.titlePath
     */
    generateTitlePath() {
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
    }

    /**
     *
     * @returns {Boolean}
     */
    isInline() {
        return this.inline;
    }

    /**
     * angular link method
     */
    link() {
        this.element.addClass('jarves-admin jarves-Window-border');
    }

    /**
     * Returns the internal window id.
     *
     * @returns {Number}
     */
    getId() {
        return this.id;
    }

    close() {
        this.windowService.unregister(this.getId());
    }

    loadContent() {
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

}