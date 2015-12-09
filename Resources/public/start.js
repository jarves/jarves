System.config({
    baseURL: './bundles',
    transpiler: 'typescript',
    //traceurOptions: {
    //    annotations: true
    //},
    //babelOptions: {
    //    stage: 1
    //},
    typescriptOptions: {
        //"noImplicitAny": true,
        //"module": "system",
        //"isolatedModules": true,
    }
});

window.angularDecoratorModule = window.jarvesModule = window.angular.module('jarves', ['ng', 'ngAnimate', 'ui.tinymce', 'ui.codemirror']);

window.jarvesModule.config( ['$provide', function ($provide){
    $provide.decorator('$browser', ['$delegate', function ($delegate) {
        $delegate.onUrlChange = function () {};
        $delegate.url = function () { return ""};
        return $delegate;
    }]);
}]);


System.import('jarves/index.ts').then(function(m) {
    //load all bundles /index.ts's.
    console.log('!BOOTSTRAP ANGULAR!');
    angular.bootstrap(document, ['jarves']);
});


