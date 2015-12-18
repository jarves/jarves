#!/bin/sh

rm -rf Resources/public/libraries/systemjs; cp -r node_modules/systemjs/dist Resources/public/libraries/systemjs;
rm -rf Resources/public/libraries/typescript; cp -r node_modules/typescript/lib Resources/public/libraries/typescript;
rm -rf Resources/public/libraries/ladda; cp -r node_modules/ladda/dist Resources/public/libraries/ladda;

rm -rf Resources/public/libraries/angular2;
mkdir Resources/public/libraries/angular2;
cp -r node_modules/angular2/bundles/angular2.dev.js Resources/public/libraries/angular2/;
cp -r node_modules/angular2/bundles/angular2.js Resources/public/libraries/angular2/;
cp -r node_modules/angular2/bundles/angular2-polyfills.js Resources/public/libraries/angular2/;


rm -rf Resources/public/libraries/rxjs;
mkdir Resources/public/libraries/rxjs;
cp -r node_modules/rxjs/bundles/Rx.js Resources/public/libraries/rxjs/;

#rm -rf Resources/public/libraries/angular-tinymce; cp -r node_modules/angular-ui-tinymce/src Resources/public/libraries/angular-tinymce;
#rm -rf Resources/public/libraries/angular-codemirror; cp -r node_modules/angular-ui-codemirror/src Resources/public/libraries/angular-codemirror;

# rm -rf Resources/public/libraries/babel-core; mkdir Resources/public/libraries/babel-core; cp node_modules/babel-core/browser*.min.js Resources/public/libraries/babel-core/

# rm -rf Resources/public/libraries/traceur; cp -r node_modules/traceur/bin Resources/public/libraries/traceur