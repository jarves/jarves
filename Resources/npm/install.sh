#!/bin/sh

rm -rf Resources/public/libraries/systemjs; cp -r node_modules/systemjs/dist Resources/public/libraries/systemjs
rm -rf Resources/public/libraries/traceur; cp -r node_modules/traceur/bin Resources/public/libraries/traceur