import {Directive} from '../angular.ts';
import {getPublicPath,eachValue} from '../utils.ts';
import angular from '../angular.ts';
import {WindowInfo, EntryPoint} from '../services/WindowManagement.ts';

@Directive('jarvesWindow', {
    restrict: 'E',
    priority: -1,
    scope: true,
    //scope: {
    //    'windowInfo': '=',
    //    'windowId': '=',
    //    'isInline': '=',
    //    'parentWindowId': '=',
    //    'parameters': '='
    //},
    templateUrl: 'bundles/jarves/views/window.html',
    controllerAs: 'jarvesWindow'
})
export default class JarvesWindow {
    private originParameters;

    private title;
    public titlePath;
    private sidebar;
    private content;
    private view;
    private frame;

    private dialogContainer;
    private contentContainer;

    public childrenWindow:JarvesWindow;

    public error:string;

    constructor(protected $scope, protected $element, protected $attrs, protected windowManagement, protected jarves,
                private $templateCache, private $http, private $compile) {

        this.originParameters = angular.fromJson(angular.toJson(this.getParameters()));

        this.view = 'bundles/jarves/views/window.default.html';

        if (this.getEntryPoint().templateUrl) {
            this.view = getPublicPath(this.getEntryPoint().templateUrl);
        } else {
            if ('custom' !== this.getEntryPoint().type && this.getEntryPoint().type) {
                if (!this.getEntryPoint().hasClass && !this.getEntryPoint().object) {
                    this.error = '`object` not defined at entry point. Did you forget to set it? If you have a own api controller define `class` instead at the entry point.';
                } else {
                    this.view = 'bundles/jarves/views/window.' + this.getEntryPoint().type.toLowerCase() + '.html';
                }
            }
        }

        console.log('new JarvesWindowController', this.getEntryPointPath(), this.view);

        windowManagement.setWindow(this.getId(), this);
        this.setTitle(this.getEntryPoint().label);

        if (this.getParentId()) {
            if (typeof this.getParentId() == 'number' && windowManagement.getWindow(this.getParentId())) {
                windowManagement.getWindow(this.getParentId()).setChildren(this);
            }
        }
    }

    getTitle() {
        return this.title;
    }

    getId():number {
        return this.getWindowInfo().id;
    }

    getParentId():number {
        return this.getWindowInfo().parentWindowId;
    }

    isInline():boolean {
        return this.getWindowInfo().isInline;
    }

    getParameters():Object {
        return this.getWindowInfo().parameters;
    }

    getWindowInfo():WindowInfo {
        return this.$scope.$eval(this.$attrs['windowInfo']);
    }


    /**
     * angular link method
     */
    link() {
        if (this.dialogContainer) {
            return;
        }

        this.$element.addClass('jarves-Window-border');

        //this.contentContainer = angular.element('<div class="jarves-Window-content-container"></div>');
        //this.element.append(this.contentContainer);

        this.dialogContainer = angular.element('<div class="jarves-Window-dialog-container"></div>');
        this.$element.append(this.dialogContainer);

        this.loadContent();
    }

    loadContent() {
        this.windowManagement.toFront(this.getId());

        if (!this.getEntryPoint().multi) {
            var win = this.windowManagement.checkOpen(this.getEntryPointPath(), this.getId());
            if (win) {
                if (win.softOpen) {
                    win.softOpen(this.getParameters());
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

    setSidebar(element:Element) {
        this.sidebar = element;
        if (this.getFrame()) {
            this.getFrame().attr('with-sidebar', true);
        }
    }

    getSidebar():Element {
        return this.sidebar;
    }

    setContent(element:Element) {
        this.content = element;
    }

    getContent():Element {
        return this.content;
    }

    setFrame(element) {
        this.frame = element;
        if (this.sidebar) {
            this.frame.attr('with-sidebar', true);
        }
    }

    getFrame():Element {
        return this.frame;
    }

    setTitle(title:string) {
        this.title = title;
        this.generateTitlePath();
    }

    getOriginParameters():Object {
        return this.originParameters;
    }

    getBundleName():string|undefined {
        if (this.getEntryPointPath().indexOf('/') > 0) {
            return this.getEntryPointPath().substr(0, this.getEntryPointPath().indexOf('/'));
        }
    }

    setChildren(window:JarvesWindow) {
        this.childrenWindow = window;
    }

    getEntryPointPath():string {
        return this.getEntryPoint().fullPath;
    }

    getEntryPoint():EntryPoint {
        return this.getWindowInfo().entryPoint;
    }

    /**
     * Sets scope.titlePath
     */
    generateTitlePath() {
        var titlePath = [];
        var title = this.jarves.getConfig(this.getBundleName())['label'] || this.jarves.getConfig(this.getBundleName())['name'];

        titlePath.push(title);

        var path = this.getEntryPoint().fullPath.split('/') || []; //todo, path is a string
        path.pop();
        for (let label of path) {
            titlePath.push(label);
        }

        titlePath.push(this.$scope.title);
        this.titlePath = titlePath;
    }

    getDialogContainer():Element {
        return this.dialogContainer;
    }

    close(force:boolean = false) {
        this.windowManagement.unregister(this.getId());
    }

}