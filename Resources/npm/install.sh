#!/bin/sh

rm -rf Resources/public/libraries/systemjs; cp -r node_modules/systemjs/dist Resources/public/libraries/systemjs

rm -rf Resources/public/libraries/babel-core; mkdir Resources/public/libraries/babel-core; cp node_modules/babel-core/browser*.min.js Resources/public/libraries/babel-core/

# rm -rf Resources/public/libraries/traceur; cp -r node_modules/traceur/bin Resources/public/libraries/traceur