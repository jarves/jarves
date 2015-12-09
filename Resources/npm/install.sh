#!/bin/sh

rm -rf Resources/public/libraries/systemjs; cp -r node_modules/systemjs/dist Resources/public/libraries/systemjs;
rm -rf Resources/public/libraries/typescript; cp -r node_modules/typescript/lib Resources/public/libraries/typescript;
rm -rf Resources/public/libraries/ladda; cp -r node_modules/ladda/dist Resources/public/libraries/ladda;

rm -rf Resources/public/libraries/angular-tinymce; cp -r node_modules/angular-ui-tinymce/src Resources/public/libraries/angular-tinymce;
rm -rf Resources/public/libraries/angular-codemirror; cp -r node_modules/angular-ui-codemirror/src Resources/public/libraries/angular-codemirror;

# rm -rf Resources/public/libraries/babel-core; mkdir Resources/public/libraries/babel-core; cp node_modules/babel-core/browser*.min.js Resources/public/libraries/babel-core/

# rm -rf Resources/public/libraries/traceur; cp -r node_modules/traceur/bin Resources/public/libraries/traceur