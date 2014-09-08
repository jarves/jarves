jarves.Directives.Window = new Class({
    Extends: jarves.Directives.AbstractDirective,
    JarvesDirective: {
        name: 'jarvesWindow',
        options: {
            restrict: 'E',
            priority: -1,
            scope: {
                'windowInfo': '=',
                'windowId': '=',
                'isInline': '=',
                'parentWindowId': '=',
                'parameters': '='
            },
            templateUrl: 'bundles/jarves/admin/js/views/window.html',
            controller: 'jarvesWindowController'
        }
    }
});