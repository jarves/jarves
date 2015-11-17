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

window.jarvesModule = window.angular.module('jarves', ['ng', 'ngAnimate']);

System.import('jarves/index.ts').then(function(m) {
    //load all bundles /index.ts's.
    console.log('!BOOTSTRAP ANGULAR!');
    angular.bootstrap(document, ['jarves']);
});


