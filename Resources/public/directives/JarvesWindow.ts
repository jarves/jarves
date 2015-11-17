import {Directive} from '../angular.ts';
import {getPublicPath,eachValue} from '../utils.ts';
import angular from '../angular.ts';

@Directive('jarvesWindow', {
    restrict: 'E',
    priority: -1,
    //scope: {
    //    'windowInfo': '=',
    //    'windowId': '=',
    //    'isInline': '=',
    //    'parentWindowId': '=',
    //    'parameters': '='
    //},
    templateUrl: 'bundles/jarves/views/window.html'
})
export default class JarvesWindow {
    private element;
    private scope;
    private attributes;
    private windowManagement;
    private jarves;
    private entryPoint;
    private id;
    private parentId;
    private inline:Boolean;
    private parameters;
    private originParameters;

    private active;
    private title;
    private titlePath;
    private sidebar;
    private content;
    private view;
    private frame;

    private dialogContainer;
    private contentContainer;

    constructor($scope, $element, $attrs, windowManagement, jarves, private $templateCache, private $http, private $compile) {
        this.scope = $scope;
        this.scope.forms = {};
        this.element = $element;
        this.attributes = $attrs;
        this.windowManagement = windowManagement;
        this.jarves = jarves;
        this.entryPoint = this.scope.windowInfo.entryPoint;
        this.id = this.scope.windowInfo.id;
        this.parentId = this.scope.parentWindowId;
        this.inline = !!this.scope.isInline;
        this.parameters = this.scope.parameters;
        this.originParameters = angular.fromJson(angular.toJson(this.scope.parameters));

        this.active = false;
        this.title = '';
        this.titlePath = [];
        this.sidebar = null;
        this.content = null;
        this.frame = null;
        this.view = 'bundles/jarves/views/window.default.html';

        if (this.entryPoint.templateUrl) {
            this.view = getPublicPath(this.entryPoint.templateUrl);
        } else {
            if ('custom' !== this.entryPoint.type && this.entryPoint.type) {
                this.view = 'bundles/jarves/views/window.' + this.entryPoint.type.toLowerCase() + '.html';
            }
        }

        console.log('new JarvesWindowController', this.entryPoint, this.view);

        this.scope.windowInfo.window = this;
        this.scope.window = this;

        this.setTitle(this.entryPoint.label);

        if (this.parentId) {
            if (typeof this.parentId == 'number' && windowManagement.getWindow(this.parentId)) {
                windowManagement.getWindow(this.parentId).setChildren(this);
            }
        }
    }


    /**
     * angular link method
     */
    link() {
        if (this.dialogContainer) {
            return;
        }

        this.element.addClass('jarves-Window-border');

        //this.contentContainer = angular.element('<div class="jarves-Window-content-container"></div>');
        //this.element.append(this.contentContainer);

        this.dialogContainer = angular.element('<div class="jarves-Window-dialog-container"></div>');
        this.element.append(this.dialogContainer);

        this.loadContent();
    }

    loadContent() {
        this.windowManagement.toFront(this);

        if (!this.entryPoint.multi) {
            var win = this.windowManagement.checkOpen(this.getEntryPoint(), this.id);
            if (win) {
                if (win.softOpen) {
                    win.softOpen(this.params);
                }
                win.toFront();
                this.close(true);
                return;
            }
        }

        //this.$http.get(this.view, {cache: this.$templateCache})
        //    .success((response)  => {
        //        var element = angular.element(response);
        //        this.contentContainer.append(element);
        //        this.$compile(this.contentContainer)(this.scope);
        //    });

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
        if (this.sidebar) {
            this.frame.attr('with-sidebar', true);
        }
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

        var path = this.getEntryPointDefinition()._path || []; //todo, _path is empty
        path.pop();
        for (let label of path) {
            titlePath.push(label);
        }

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

    getDialogContainer() {
        return this.dialogContainer;
    }

    /**
     * Returns the internal window id.
     *
     * @returns {Number}
     */
    getId() {
        return this.id;
    }

    close(force) {
        this.windowManagement.unregister(this.getId());
    }

}